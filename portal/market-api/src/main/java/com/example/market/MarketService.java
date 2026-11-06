package com.example.market;

import com.example.market.Models.*;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.ToDoubleFunction;
import java.util.stream.Collectors;

/** Aggregate statistics over the housing dataset. Results are cached per filter set. */
@Service
public class MarketService {
    private static final Map<String, ToDoubleFunction<HousingRecord>> SORTABLE = Map.of(
            "id", r -> r.id(), "squareFootage", HousingRecord::squareFootage, "bedrooms", HousingRecord::bedrooms,
            "bathrooms", HousingRecord::bathrooms, "yearBuilt", HousingRecord::yearBuilt,
            "lotSize", HousingRecord::lotSize, "distanceToCityCentre", HousingRecord::distanceToCityCentre,
            "schoolRating", HousingRecord::schoolRating, "price", HousingRecord::price);

    /** Segment dimension -> (value extractor, bin edges). The last bin is open-ended. */
    private record Dim(ToDoubleFunction<HousingRecord> value, double[] edges) {}

    private static final double INF = Double.MAX_VALUE;
    private static final Map<String, Dim> DIMS = Map.of(
            "size", new Dim(HousingRecord::squareFootage, new double[]{0, 1000, 1500, 2000, 2500, 3000, 4000, INF}),
            "age", new Dim(HousingRecord::yearBuilt, new double[]{0, 1950, 1970, 1990, 2005, 2015, INF}),
            "distance", new Dim(HousingRecord::distanceToCityCentre, new double[]{0, 3, 6, 10, 15, 25, INF}),
            "school", new Dim(HousingRecord::schoolRating, new double[]{0, 4, 5, 6, 7, 8, 9, INF}),
            "bedrooms", new Dim(HousingRecord::bedrooms, new double[]{0, 2, 3, 4, 5, INF}));

    private final DatasetService data;

    public MarketService(DatasetService data) { this.data = data; }

    public List<HousingRecord> filtered(Filters f) {
        return data.all().stream().filter(f::matches).toList();
    }

    @Cacheable(cacheNames = "summary", key = "#f")
    public Summary summary(Filters f) {
        List<HousingRecord> rows = filtered(f);
        if (rows.isEmpty()) return new Summary(0, 0, 0, 0, 0, 0, 0, 0, 0, List.of());
        double[] prices = rows.stream().mapToDouble(HousingRecord::price).sorted().toArray();
        return new Summary(rows.size(), mean(prices), percentile(prices, 50), percentile(prices, 10),
                percentile(prices, 90), prices[0], prices[prices.length - 1],
                rows.stream().mapToDouble(HousingRecord::squareFootage).average().orElse(0),
                rows.stream().mapToDouble(HousingRecord::schoolRating).average().orElse(0),
                histogram(prices, 12));
    }

    @Cacheable(cacheNames = "segments", key = "#by + '|' + #f")
    public List<Segment> segments(String by, Filters f) {
        Dim dim = DIMS.get(by);
        if (dim == null) {
            throw new IllegalArgumentException("Unknown segment dimension: " + by + " (use " + String.join(", ", new TreeSet<>(DIMS.keySet())) + ")");
        }
        double[] e = dim.edges();
        List<String> order = new ArrayList<>();
        for (int i = 0; i < e.length - 1; i++) order.add(label(e[i], e[i + 1]));

        Map<String, List<HousingRecord>> groups = filtered(f).stream().collect(Collectors.groupingBy(r -> {
            double v = dim.value().applyAsDouble(r);
            for (int i = 0; i < e.length - 1; i++) if (v >= e[i] && v < e[i + 1]) return label(e[i], e[i + 1]);
            return label(e[e.length - 2], e[e.length - 1]);
        }));

        List<Segment> out = new ArrayList<>();
        for (String label : order) {
            List<HousingRecord> g = groups.getOrDefault(label, List.of());
            if (g.isEmpty()) continue;
            double[] p = g.stream().mapToDouble(HousingRecord::price).sorted().toArray();
            out.add(new Segment(label, g.size(), mean(p), percentile(p, 50)));
        }
        return out;
    }

    public Page<HousingRecord> page(Filters f, int page, int size, String sort, boolean desc) {
        var key = SORTABLE.get(sort);
        if (key == null) throw new IllegalArgumentException("Cannot sort by: " + sort);
        size = Math.min(Math.max(size, 1), 200);
        page = Math.max(page, 0);
        Comparator<HousingRecord> cmp = Comparator.comparingDouble(key);
        if (desc) cmp = cmp.reversed();
        List<HousingRecord> rows = filtered(f).stream().sorted(cmp).toList();
        int from = Math.min(page * size, rows.size());
        int to = Math.min(from + size, rows.size());
        return new Page<>(rows.subList(from, to), page, size, rows.size(),
                (int) Math.ceil(rows.size() / (double) size));
    }

    public String csv(Filters f, int limit) {
        var sb = new StringBuilder("id,square_footage,bedrooms,bathrooms,year_built,lot_size,distance_to_city_centre,school_rating,price\n");
        filtered(f).stream().limit(limit).forEach(r -> sb.append(String.join(",",
                Long.toString(r.id()), num(r.squareFootage()), num(r.bedrooms()), num(r.bathrooms()),
                num(r.yearBuilt()), num(r.lotSize()), num(r.distanceToCityCentre()), num(r.schoolRating()),
                num(r.price()))).append('\n'));
        return sb.toString();
    }

    // ---- helpers (package-private for tests) ----
    private static String num(double v) { return v == Math.rint(v) ? Long.toString((long) v) : Double.toString(v); }

    static double mean(double[] a) { return Arrays.stream(a).average().orElse(0); }

    /** Linear-interpolated percentile of an already sorted array. */
    static double percentile(double[] sorted, double p) {
        if (sorted.length == 0) return 0;
        double idx = p / 100.0 * (sorted.length - 1);
        int lo = (int) Math.floor(idx), hi = (int) Math.ceil(idx);
        return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
    }

    static List<Bin> histogram(double[] sorted, int bins) {
        double min = sorted[0], max = sorted[sorted.length - 1];
        double width = (max - min) / bins;
        if (width == 0) return List.of(new Bin(money(min), min, max, sorted.length));
        long[] counts = new long[bins];
        for (double v : sorted) counts[Math.min((int) ((v - min) / width), bins - 1)]++;
        List<Bin> out = new ArrayList<>();
        for (int i = 0; i < bins; i++) {
            double a = min + i * width, b = a + width;
            out.add(new Bin(money(a) + "–" + money(b), a, b, counts[i]));
        }
        return out;
    }

    private static String money(double v) { return "$" + Math.round(v / 1000) + "k"; }

    private static String label(double a, double b) {
        if (b == INF) return (int) a + "+";
        return (int) a + "–" + (int) b;
    }
}

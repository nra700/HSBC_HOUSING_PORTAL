package com.example.market;

import com.example.market.Models.HousingRecord;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/** Loads data/housing.csv into memory once at startup. Columns are located by header name, not position. */
@Service
public class DatasetService {
    private static final Logger log = LoggerFactory.getLogger(DatasetService.class);
    private static final List<String> REQUIRED = List.of("id", "square_footage", "bedrooms", "bathrooms",
            "year_built", "lot_size", "distance_to_city_centre", "school_rating", "price");

    private final MarketApplication.MarketProperties props;
    private volatile List<HousingRecord> records = List.of();

    public DatasetService(MarketApplication.MarketProperties props) { this.props = props; }

    @PostConstruct
    void load() {
        Path path = Path.of(props.datasetPath());
        try (var lines = Files.lines(path)) {
            var it = lines.iterator();
            if (!it.hasNext()) throw new IllegalStateException("Dataset is empty: " + path);
            List<String> header = List.of(it.next().split(",")).stream().map(h -> h.trim().toLowerCase()).toList();
            for (String col : REQUIRED) {
                if (!header.contains(col)) {
                    throw new IllegalStateException("Dataset missing column '" + col + "'. Found " + header
                            + ". Run scripts/prepare_data.py --source <file> to normalise it.");
                }
            }
            int[] ix = REQUIRED.stream().mapToInt(header::indexOf).toArray();
            List<HousingRecord> out = new ArrayList<>();
            while (it.hasNext()) {
                String line = it.next();
                if (line.isBlank()) continue;
                String[] c = line.split(",");
                out.add(new HousingRecord((long) d(c[ix[0]]), d(c[ix[1]]), d(c[ix[2]]), d(c[ix[3]]),
                        d(c[ix[4]]), d(c[ix[5]]), d(c[ix[6]]), d(c[ix[7]]), d(c[ix[8]])));
            }
            records = List.copyOf(out);
            log.info("Loaded {} housing records from {}", records.size(), path.toAbsolutePath());
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot read dataset at " + path.toAbsolutePath()
                    + " (run scripts/prepare_data.py or set DATASET_PATH)", e);
        }
    }

    private static double d(String s) { return Double.parseDouble(s.trim()); }

    public List<HousingRecord> all() { return records; }

    /** Test hook. */
    void setRecords(List<HousingRecord> r) { this.records = List.copyOf(r); }
}

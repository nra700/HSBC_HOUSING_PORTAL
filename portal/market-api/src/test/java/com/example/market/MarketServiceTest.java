package com.example.market;

import com.example.market.Models.*;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MarketServiceTest {

    private static HousingRecord rec(long id, double sqft, double beds, double year, double school, double price) {
        return new HousingRecord(id, sqft, beds, 2, year, 5000, 5, school, price);
    }

    private MarketService service() {
        var ds = new DatasetService(new MarketApplication.MarketProperties("unused", "unused"));
        ds.setRecords(List.of(rec(1, 900, 2, 1960, 5, 200_000), rec(2, 1800, 3, 1995, 7, 400_000),
                rec(3, 3200, 5, 2010, 9, 800_000), rec(4, 1600, 3, 2001, 6, 300_000)));
        return new MarketService(ds);
    }

    @Test void percentileInterpolates() {
        assertEquals(2.5, MarketService.percentile(new double[]{1, 2, 3, 4}, 50), 1e-9);
    }

    @Test void summaryRespectsFilters() {
        var all = service().summary(Filters.none());
        assertEquals(4, all.count());
        assertEquals(425_000, all.meanPrice(), 1e-6);
        var big = service().summary(new Filters(null, null, 1500.0, null, null, null, null, null, null, null));
        assertEquals(3, big.count());
    }

    @Test void segmentsBySizeAreOrderedAndNonEmpty() {
        var segs = service().segments("size", Filters.none());
        assertEquals(List.of("0–1000", "1500–2000", "3000–4000"), segs.stream().map(Segment::label).toList());
        assertEquals(2, segs.get(1).count());
        assertThrows(IllegalArgumentException.class, () -> service().segments("bogus", Filters.none()));
    }

    @Test void pagingSortsAndRejectsUnknownColumn() {
        var page = service().page(Filters.none(), 0, 2, "price", true);
        assertEquals(4, page.totalElements());
        assertEquals(3L, page.content().get(0).id());
        assertThrows(IllegalArgumentException.class, () -> service().page(Filters.none(), 0, 2, "bogus", true));
    }
}

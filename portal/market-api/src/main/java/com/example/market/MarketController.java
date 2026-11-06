package com.example.market;

import com.example.market.Models.*;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market")
public class MarketController {
    private final MarketService market;
    private final WhatIfService whatIf;
    private final ModelClient model;

    public MarketController(MarketService market, WhatIfService whatIf, ModelClient model) {
        this.market = market;
        this.whatIf = whatIf;
        this.model = model;
    }

    @GetMapping("/summary")
    public Summary summary(Filters f) { return market.summary(f); }

    @GetMapping("/segments")
    public List<Segment> segments(@RequestParam(defaultValue = "size") String by, Filters f) {
        return market.segments(by, f);
    }

    @GetMapping("/properties")
    public Page<HousingRecord> properties(Filters f,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "25") int size,
                                          @RequestParam(defaultValue = "price") String sort,
                                          @RequestParam(defaultValue = "desc") String dir) {
        return market.page(f, page, size, sort, dir.equalsIgnoreCase("desc"));
    }

    @GetMapping(value = "/export.csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportCsv(Filters f, @RequestParam(defaultValue = "50000") int limit) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("market-data.csv").build().toString())
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(market.csv(f, limit).getBytes(StandardCharsets.UTF_8));
    }

    @PostMapping("/what-if")
    public WhatIfResponse whatIf(@Valid @RequestBody WhatIfRequest req) {
        return whatIf.sweep(req);
    }

    @GetMapping("/model-info")
    public Map<String, Object> modelInfo() { return model.modelInfo(); }
}

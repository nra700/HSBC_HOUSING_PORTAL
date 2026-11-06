package com.example.market;

import com.example.market.Models.*;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** "What if" analysis: sweep one feature across a range and ask the model for each price. */
@Service
public class WhatIfService {
    private static final Set<String> FEATURES = Set.of("square_footage", "bedrooms", "bathrooms", "year_built",
            "lot_size", "distance_to_city_centre", "school_rating");
    private final ModelClient model;

    public WhatIfService(ModelClient model) { this.model = model; }

    @Cacheable(cacheNames = "whatIf", key = "#req")
    public WhatIfResponse sweep(WhatIfRequest req) {
        if (!FEATURES.contains(req.feature())) {
            throw new IllegalArgumentException("Unknown feature: " + req.feature());
        }
        if (req.from() >= req.to()) throw new IllegalArgumentException("'from' must be less than 'to'");

        List<Double> xs = new ArrayList<>();
        List<Map<String, Double>> instances = new ArrayList<>();
        instances.add(req.base().asMap());           // index 0 = unchanged baseline
        for (int i = 0; i < req.steps(); i++) {
            double x = req.from() + (req.to() - req.from()) * i / (req.steps() - 1);
            xs.add(x);
            var m = new java.util.LinkedHashMap<>(req.base().asMap());
            m.put(req.feature(), x);
            instances.add(m);
        }
        List<Double> prices = model.predictUsd(instances);
        return new WhatIfResponse(req.feature(), prices.get(0),
                ModelClient.zip(xs, prices.subList(1, prices.size())));
    }
}

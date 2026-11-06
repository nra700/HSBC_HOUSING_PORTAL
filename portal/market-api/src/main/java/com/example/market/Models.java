package com.example.market;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** DTOs and value types, kept together because each is tiny. */
public final class Models {
    private Models() {}

    /** One row of data/housing.csv. */
    public record HousingRecord(long id, double squareFootage, double bedrooms, double bathrooms,
                                double yearBuilt, double lotSize, double distanceToCityCentre,
                                double schoolRating, double price) {}

    /**
     * Filter criteria, bound straight from query parameters. Records give equals/hashCode for free,
     * so a Filters instance doubles as a cache key.
     */
    public record Filters(Double minPrice, Double maxPrice, Double minSqft, Double maxSqft,
                          Double minBedrooms, Double maxBedrooms, Double minYear, Double maxYear,
                          Double minSchool, Double maxDistance) {
        public static Filters none() {
            return new Filters(null, null, null, null, null, null, null, null, null, null);
        }

        public boolean matches(HousingRecord r) {
            return (minPrice == null || r.price() >= minPrice)
                    && (maxPrice == null || r.price() <= maxPrice)
                    && (minSqft == null || r.squareFootage() >= minSqft)
                    && (maxSqft == null || r.squareFootage() <= maxSqft)
                    && (minBedrooms == null || r.bedrooms() >= minBedrooms)
                    && (maxBedrooms == null || r.bedrooms() <= maxBedrooms)
                    && (minYear == null || r.yearBuilt() >= minYear)
                    && (maxYear == null || r.yearBuilt() <= maxYear)
                    && (minSchool == null || r.schoolRating() >= minSchool)
                    && (maxDistance == null || r.distanceToCityCentre() <= maxDistance);
        }
    }

    public record Bin(String label, double from, double to, long count) {}

    public record Summary(long count, double meanPrice, double medianPrice, double p10Price, double p90Price,
                          double minPrice, double maxPrice, double meanSquareFootage, double meanSchoolRating,
                          List<Bin> priceHistogram) {}

    public record Segment(String label, long count, double meanPrice, double medianPrice) {}

    public record Page<T>(List<T> content, int page, int size, long totalElements, int totalPages) {}

    public record WhatIfRequest(
            @NotNull @Valid Features base,
            @NotBlank String feature,
            @NotNull Double from,
            @NotNull Double to,
            @Min(2) @Max(50) int steps) {}

    /** Model input. JSON keys are the snake_case names the model API expects. */
    public record Features(@JsonProperty("square_footage") @NotNull Double squareFootage,
                           @JsonProperty("bedrooms") @NotNull Double bedrooms,
                           @JsonProperty("bathrooms") @NotNull Double bathrooms,
                           @JsonProperty("year_built") @NotNull Double yearBuilt,
                           @JsonProperty("lot_size") @NotNull Double lotSize,
                           @JsonProperty("distance_to_city_centre") @NotNull Double distanceToCityCentre,
                           @JsonProperty("school_rating") @NotNull Double schoolRating) {
        public Map<String, Double> asMap() {
            var m = new LinkedHashMap<String, Double>();
            m.put("square_footage", squareFootage);
            m.put("bedrooms", bedrooms);
            m.put("bathrooms", bathrooms);
            m.put("year_built", yearBuilt);
            m.put("lot_size", lotSize);
            m.put("distance_to_city_centre", distanceToCityCentre);
            m.put("school_rating", schoolRating);
            return m;
        }
    }

    public record WhatIfPoint(double value, double predictedPriceUsd) {}

    public record WhatIfResponse(String feature, double basePriceUsd, List<WhatIfPoint> points) {}
}

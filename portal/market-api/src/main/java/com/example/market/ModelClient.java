package com.example.market;

import com.example.market.Models.WhatIfPoint;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/** Talks to the Task 1 model container. */
@Component
public class ModelClient {
    private final RestClient http;

    public ModelClient(MarketApplication.MarketProperties props, RestClient.Builder builder) {
        this.http = builder.baseUrl(props.modelApiUrl()).build();
    }

    /** Returns the predicted price in USD for each instance, in order. */
    @SuppressWarnings("unchecked")
    public List<Double> predictUsd(List<Map<String, Double>> instances) {
        try {
            Map<String, Object> body = http.post().uri("/predict")
                    .body(Map.of("instances", instances))
                    .retrieve().body(new ParameterizedTypeReference<>() {});
            List<Map<String, Object>> preds = (List<Map<String, Object>>) body.get("predictions");
            return preds.stream().map(p -> ((Number) p.get("predicted_price_usd")).doubleValue()).toList();
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Model service call failed: " + e.getMessage());
        }
    }

    @Cacheable("modelInfo")
    public Map<String, Object> modelInfo() {
        try {
            return http.get().uri("/model-info").retrieve().body(new ParameterizedTypeReference<>() {});
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Model service call failed: " + e.getMessage());
        }
    }

    public static List<WhatIfPoint> zip(List<Double> xs, List<Double> ys) {
        return java.util.stream.IntStream.range(0, xs.size()).mapToObj(i -> new WhatIfPoint(xs.get(i), ys.get(i))).toList();
    }
}

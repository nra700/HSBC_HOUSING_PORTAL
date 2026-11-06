package com.example.market;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
@EnableConfigurationProperties(MarketApplication.MarketProperties.class)
public class MarketApplication {

    @ConfigurationProperties(prefix = "market")
    public record MarketProperties(String datasetPath, String modelApiUrl) {}

    public static void main(String[] args) {
        SpringApplication.run(MarketApplication.class, args);
    }
}

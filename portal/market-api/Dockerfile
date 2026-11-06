# Build from portal/market-api:  docker build -t housing-market-api .
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /build/target/market-api-1.0.0.jar app.jar
ENV DATASET_PATH=/data/housing.csv
EXPOSE 8002
ENTRYPOINT ["java", "-jar", "app.jar"]

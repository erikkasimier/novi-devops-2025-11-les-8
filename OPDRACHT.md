# Les 8 - Monitoring & Observability

## 🎯 Leerdoel
Bouw een monitoring dashboard met Prometheus en Grafana voor de DevOps demo app.

## 📋 Voorwaarden
- Docker en Docker Compose geïnstalleerd
- DevOps demo app (uit vorige lessen)

---

## Opdracht 1: Monitoring Stack Starten

### Stappen
1. Navigeer naar de directory
2. Start de monitoring stack:
   ```bash
   docker-compose up -d
   ```
3. Verifieer dat alle containers draaien:
   ```bash
   docker-compose ps
   ```

### Toegang tot services
| Service | URL | Credentials |
|---------|-----|-------------|
| App | http://localhost:3000 | - |
| Prometheus | http://localhost:9090 | - |
| Grafana | http://localhost:3001 | admin / admin |

### Verificatie
- [ ] Alle 3 containers zijn "Up"
- [ ] App is bereikbaar op :3000
- [ ] Prometheus UI is bereikbaar op :9090
- [ ] Grafana UI is bereikbaar op :3001

---

## Opdracht 2: Prometheus Data Source Configureren

### Stappen in Grafana
1. Login op http://localhost:3001 (admin/admin)
2. Ga naar **Connections** → **Data sources**
3. Klik **Add data source**
4. Selecteer **Prometheus**
5. Configureer:
    - **URL:** `http://prometheus:9090`
    - Klik **Save & test**

### Prometheus Targets Checken
1. Ga naar http://localhost:9090
2. Klik op **Status** → **Targets**
3. Verifieer dat de app target "UP" is

### Verificatie
- [ ] Data source is toegevoegd
- [ ] "Data source is working" melding verschijnt
- [ ] Prometheus target toont app als "UP"

---

## Opdracht 3: Dashboard Bouwen

### Doel
Bouw een dashboard met minimaal 4 panels.

### Panel 1: Application Status
- **Type:** Stat
- **Query:** `up{job="devops-app"}`
- **Value mappings:** 1 = UP (groen), 0 = DOWN (rood)

### Panel 2: Request Rate
- **Type:** Time series
- **Query:** `rate(http_requests_total{job="devops-app"}[5m])`
- **Legend:** `{{ method }} {{ endpoint }}`

### Panel 3: Process Uptime
- **Type:** Stat
- **Query:** `process_uptime_seconds{job="devops-app"}`
- **Unit:** seconds (s)

### Panel 4: Memory Usage
- **Type:** Gauge
- **Query:** `process_resident_memory_bytes{job="devops-app"}`
- **Unit:** bytes (B)
- **Thresholds:** 100MB = geel, 200MB = rood

### Stappen
1. Klik **+** → **New dashboard**
2. Klik **Add visualization**
3. Selecteer **Prometheus** als data source
4. Voer de query in
5. Configureer visualisatie opties
6. Klik **Apply**
7. Herhaal voor elk panel
8. **Sla het dashboard op!**

---

## Opdracht 4: PromQL Experimenteren

### Basis queries om te proberen

```promql
# Huidige waarde
up

# Filter op job
up{job="devops-app"}

# Rate over tijd (requests per seconde)
rate(http_requests_total[5m])

# Totaal aantal requests
http_requests_total

# Process info
process_cpu_seconds_total
process_resident_memory_bytes

# App info
app_info
```

### Probeer in Prometheus UI
1. Ga naar http://localhost:9090
2. Voer queries in bij "Expression"
3. Klik "Execute"
4. Bekijk "Graph" tab voor visualisatie

---

## Bonus: Alert Regel Toevoegen

### In Grafana
1. Open een panel in edit mode
2. Ga naar **Alert** tab
3. Klik **Create alert rule from this panel**
4. Configureer:
    - **Condition:** `last() of A is below 1`
    - **Evaluate every:** 1m
    - **For:** 5m

### Alert wanneer app down is
```yaml
# In prometheus/alert_rules.yml
groups:
  - name: app_alerts
    rules:
      - alert: AppDown
        expr: up{job="devops-app"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Application is down"
```

---

## ✅ Acceptatiecriteria

- [ ] Monitoring stack draait (3 containers)
- [ ] Prometheus scrapet metrics van de app
- [ ] Grafana heeft Prometheus als data source
- [ ] Dashboard bevat minimaal 4 panels
- [ ] Panels tonen real-time data
- [ ] Dashboard is opgeslagen

---

## 🔧 Handige PromQL Queries

```promql
# Gemiddelde response tijd (als je histogram hebt)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Request rate per endpoint
sum(rate(http_requests_total[5m])) by (endpoint)

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) 
  / 
sum(rate(http_requests_total[5m])) * 100

# Memory als percentage van limit
process_resident_memory_bytes / 268435456 * 100  # 256MB limit
```

---

## 🔍 Troubleshooting

### Prometheus kan app niet bereiken
```bash
# Check of app metrics endpoint werkt
curl http://localhost:3000/metrics

# Check netwerk
docker network ls
docker network inspect monitoring_default
```

### Geen data in Grafana
1. Check Prometheus targets: http://localhost:9090/targets
2. Verifieer data source connection
3. Check time range in Grafana (laatste 5 min)

### Container start niet
```bash
# Bekijk logs
docker-compose logs prometheus
docker-compose logs grafana
docker-compose logs app
```

---

## 📚 Bronnen
- [Prometheus Query Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboard Tutorial](https://grafana.com/tutorials/grafana-fundamentals/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)

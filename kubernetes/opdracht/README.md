# Kubernetes Verdieping - Extra Materiaal

Deze map bevat uitgebreide Kubernetes materialen voor studenten die meer willen leren.

## Inhoud

```
kubernetes-verdieping/
├── OPDRACHT.md              # Volledige verdiepingsopdracht
├── manifests/               # Kubernetes YAML manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── ingress.yaml
│   └── hpa.yaml
└── helm-chart/              # Complete Helm chart
    ├── Chart.yaml
    ├── values.yaml
    └── templates/
        ├── deployment.yaml
        ├── service.yaml
        ├── ingress.yaml
        └── hpa.yaml
```

## Onderwerpen

1. **Cluster Setup** - minikube met addons
2. **Deployments** - Resources, probes, replicas
3. **Services** - ClusterIP, NodePort, LoadBalancer
4. **Ingress** - HTTP routing
5. **ConfigMaps & Secrets** - Configuratie management
6. **HPA** - Horizontal Pod Autoscaling
7. **Helm** - Package management voor Kubernetes

## Vereisten

- Docker Desktop
- minikube
- kubectl
- helm (voor deel 5)

## Geschatte tijd

2-4 uur afhankelijk van ervaring

## Let op

Dit is **optioneel** materiaal en staat los van de reguliere lesstof.

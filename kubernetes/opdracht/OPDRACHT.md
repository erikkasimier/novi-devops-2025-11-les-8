# Kubernetes Verdieping - Opdracht voor Liefhebbers

> **Let op:** Dit is een **optionele verdiepingsopdracht** voor studenten die meer willen leren over Kubernetes. Deze opdracht staat los van de reguliere lesstof en is niet verplicht.

## 🎯 Doel
Bouw een complete Kubernetes deployment met alle belangrijke concepten: Deployments, Services, ConfigMaps, Secrets, Ingress, en Horizontal Pod Autoscaling.

## ⏱️ Geschatte tijd
2-4 uur (afhankelijk van ervaring)

## 📋 Voorwaarden
- Docker Desktop geïnstalleerd en draaiend
- minikube geïnstalleerd
- kubectl geïnstalleerd
- Basis begrip van Kubernetes concepten

---

## Deel 1: Cluster Setup & Basis Deployment (30 min)

### 1.1 Start minikube met extra features
```bash
# Start minikube met metrics-server en ingress
minikube start --memory=4096 --cpus=2

# Enable addons
minikube addons enable metrics-server
minikube addons enable ingress

# Verifieer
minikube status
kubectl get nodes
```

### 1.2 Namespace aanmaken
Kubernetes namespaces isoleren resources. Maak een dedicated namespace:

```bash
kubectl create namespace devops-demo
kubectl config set-context --current --namespace=devops-demo
```

### 1.3 Basis Deployment
Maak `deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: devops-app
  namespace: devops-demo
  labels:
    app: devops-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: devops-app
  template:
    metadata:
      labels:
        app: devops-app
    spec:
      containers:
      - name: devops-app
        image: nginx:alpine  # We vervangen dit later
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 5
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 3
```

```bash
kubectl apply -f deployment.yaml
kubectl get pods -w  # Watch pods starten
```

### ✅ Checkpoint 1
- [ ] minikube draait met addons
- [ ] Namespace `devops-demo` bestaat
- [ ] 2 pods zijn Running

---

## Deel 2: Services & Networking (30 min)

### 2.1 ClusterIP Service (intern)
Maak `service-clusterip.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: devops-app-internal
  namespace: devops-demo
spec:
  type: ClusterIP
  selector:
    app: devops-app
  ports:
  - port: 80
    targetPort: 80
```

### 2.2 NodePort Service (extern toegankelijk)
Maak `service-nodeport.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: devops-app-external
  namespace: devops-demo
spec:
  type: NodePort
  selector:
    app: devops-app
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080  # Toegankelijk op dit port
```

```bash
kubectl apply -f service-clusterip.yaml
kubectl apply -f service-nodeport.yaml

# Test via NodePort
minikube service devops-app-external -n devops-demo
```

### 2.3 Ingress (HTTP routing)
Maak `ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: devops-app-ingress
  namespace: devops-demo
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: devops.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: devops-app-internal
            port:
              number: 80
```

```bash
kubectl apply -f ingress.yaml

# Voeg toe aan /etc/hosts (of C:\Windows\System32\drivers\etc\hosts)
# <minikube-ip> devops.local
echo "$(minikube ip) devops.local" | sudo tee -a /etc/hosts

# Test
curl http://devops.local
```

### ✅ Checkpoint 2
- [ ] ClusterIP service werkt
- [ ] NodePort service is extern bereikbaar
- [ ] Ingress routeert naar de app

---

## Deel 3: ConfigMaps & Secrets (30 min)

### 3.1 ConfigMap voor configuratie
Maak `configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: devops-demo
data:
  APP_ENV: "production"
  LOG_LEVEL: "info"
  API_TIMEOUT: "30"
  # Multi-line config file
  nginx.conf: |
    server {
        listen 80;
        server_name localhost;
        
        location / {
            root /usr/share/nginx/html;
            index index.html;
        }
        
        location /health {
            return 200 'healthy';
            add_header Content-Type text/plain;
        }
    }
```

### 3.2 Secret voor gevoelige data
```bash
# Maak secret via kubectl (base64 encoded)
kubectl create secret generic app-secrets \
  --from-literal=DB_PASSWORD='supersecret123' \
  --from-literal=API_KEY='sk-abc123xyz' \
  -n devops-demo

# Of via YAML (waarden moeten base64 encoded zijn)
```

Maak `secret.yaml`:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: devops-demo
type: Opaque
data:
  # echo -n 'supersecret123' | base64
  DB_PASSWORD: c3VwZXJzZWNyZXQxMjM=
  # echo -n 'sk-abc123xyz' | base64
  API_KEY: c2stYWJjMTIzeHl6
```

### 3.3 Update Deployment om ConfigMap en Secret te gebruiken
Update `deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: devops-app
  namespace: devops-demo
spec:
  replicas: 2
  selector:
    matchLabels:
      app: devops-app
  template:
    metadata:
      labels:
        app: devops-app
    spec:
      containers:
      - name: devops-app
        image: nginx:alpine
        ports:
        - containerPort: 80
        # Environment variables van ConfigMap
        envFrom:
        - configMapRef:
            name: app-config
        # Environment variables van Secret
        env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DB_PASSWORD
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: API_KEY
        # Mount config file
        volumeMounts:
        - name: nginx-config
          mountPath: /etc/nginx/conf.d/default.conf
          subPath: nginx.conf
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
      volumes:
      - name: nginx-config
        configMap:
          name: app-config
```

```bash
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f deployment.yaml

# Verifieer environment variables
kubectl exec -it $(kubectl get pod -l app=devops-app -o jsonpath='{.items[0].metadata.name}') -- env | grep -E 'APP_ENV|DB_PASSWORD|API_KEY'
```

### ✅ Checkpoint 3
- [ ] ConfigMap bevat app configuratie
- [ ] Secret bevat gevoelige data
- [ ] Pods hebben access tot beide via env vars

---

## Deel 4: Horizontal Pod Autoscaling (30 min)

### 4.1 HPA aanmaken
Maak `hpa.yaml`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: devops-app-hpa
  namespace: devops-demo
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: devops-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
```

```bash
kubectl apply -f hpa.yaml
kubectl get hpa -w  # Watch HPA status
```

### 4.2 Load test om autoscaling te triggeren
```bash
# In een aparte terminal: genereer load
kubectl run load-generator --image=busybox --restart=Never -- /bin/sh -c "while true; do wget -q -O- http://devops-app-internal; done"

# Watch pods schalen
kubectl get pods -w

# Watch HPA metrics
kubectl get hpa devops-app-hpa -w

# Stop load generator
kubectl delete pod load-generator
```

### ✅ Checkpoint 4
- [ ] HPA is geconfigureerd
- [ ] Pods schalen bij load
- [ ] Pods schalen terug na load

---

## Deel 5: Helm Basics (45 min)

### 5.1 Helm installeren
```bash
# macOS
brew install helm

# Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verifieer
helm version
```

### 5.2 Helm chart structuur maken
```bash
mkdir -p devops-app-chart/templates
cd devops-app-chart
```

Maak `Chart.yaml`:
```yaml
apiVersion: v2
name: devops-app
description: DevOps Demo Application Helm Chart
version: 1.0.0
appVersion: "1.0.0"
```

Maak `values.yaml`:
```yaml
# Default values
replicaCount: 2

image:
  repository: nginx
  tag: alpine
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  host: devops.local

resources:
  requests:
    memory: "64Mi"
    cpu: "100m"
  limits:
    memory: "128Mi"
    cpu: "200m"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilization: 50

config:
  APP_ENV: production
  LOG_LEVEL: info
```

Maak `templates/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-app
  labels:
    app: {{ .Release.Name }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app: {{ .Release.Name }}
    spec:
      containers:
      - name: {{ .Release.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        ports:
        - containerPort: {{ .Values.service.port }}
        env:
        {{- range $key, $value := .Values.config }}
        - name: {{ $key }}
          value: {{ $value | quote }}
        {{- end }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
```

Maak `templates/service.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}-service
spec:
  type: {{ .Values.service.type }}
  selector:
    app: {{ .Release.Name }}
  ports:
  - port: {{ .Values.service.port }}
    targetPort: {{ .Values.service.port }}
```

### 5.3 Helm chart deployen
```bash
# Lint chart
helm lint .

# Dry-run (zie wat er gegenereerd wordt)
helm template my-release . --debug

# Installeer
helm install my-app . -n devops-demo

# Bekijk release
helm list -n devops-demo

# Upgrade met andere values
helm upgrade my-app . --set replicaCount=3 -n devops-demo

# Uninstall
helm uninstall my-app -n devops-demo
```

### ✅ Checkpoint 5
- [ ] Helm chart structuur gemaakt
- [ ] Chart installeert succesvol
- [ ] Values kunnen overschreven worden

---

## Deel 6: Cleanup & Best Practices (15 min)

### 6.1 Cleanup
```bash
# Delete namespace (verwijdert alles erin)
kubectl delete namespace devops-demo

# Stop minikube
minikube stop

# Of verwijder cluster volledig
minikube delete
```

### 6.2 Best Practices Checklist

**Resource Management**
- [ ] Altijd resource requests en limits definiëren
- [ ] Memory limits iets hoger dan requests
- [ ] CPU limits optioneel (kan throttling veroorzaken)

**Health Checks**
- [ ] Liveness probe: herstart pod als unhealthy
- [ ] Readiness probe: verwijder uit service als niet ready
- [ ] Startup probe: voor slow-starting apps

**Security**
- [ ] Secrets nooit in version control
- [ ] Gebruik RBAC voor access control
- [ ] Draai containers als non-root
- [ ] Network policies voor isolation

**Configuration**
- [ ] ConfigMaps voor niet-gevoelige config
- [ ] Secrets voor gevoelige data
- [ ] Environment-specifieke values via Helm

**Scaling**
- [ ] HPA voor automatisch schalen
- [ ] Pod Disruption Budgets voor high availability
- [ ] Anti-affinity rules voor spreiding

---

## 📚 Bronnen voor Verder Leren

### Officiële Documentatie
- [Kubernetes Docs](https://kubernetes.io/docs/)
- [Helm Docs](https://helm.sh/docs/)
- [minikube Docs](https://minikube.sigs.k8s.io/docs/)

### Tutorials
- [Kubernetes the Hard Way](https://github.com/kelseyhightower/kubernetes-the-hard-way)
- [CKAD Exercises](https://github.com/dgkanatsios/CKAD-exercises)

### Video's
- [TechWorld with Nana - Kubernetes Tutorial](https://www.youtube.com/watch?v=X48VuDVv0do)
- [Fireship - Kubernetes Explained](https://www.youtube.com/watch?v=PziYflu8cB8)

---

## ✅ Eindchecklist

Na het voltooien van deze opdracht kun je:

- [ ] Een minikube cluster opzetten met addons
- [ ] Namespaces gebruiken voor isolatie
- [ ] Deployments maken met resource limits en probes
- [ ] Services configureren (ClusterIP, NodePort)
- [ ] Ingress voor HTTP routing
- [ ] ConfigMaps en Secrets beheren
- [ ] Horizontal Pod Autoscaling configureren
- [ ] Basis Helm charts maken en deployen

**Gefeliciteerd!** Je hebt nu een solide basis in Kubernetes. 🎉

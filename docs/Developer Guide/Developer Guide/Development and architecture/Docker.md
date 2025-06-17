# Docker
To run a Docker build:

```
./bin/builder-docker.sh
```

To run the built Docker image:

```
sudo docker run -p 8081:8080 triliumnext/notes:v0.90.6-beta
```

To enter a shell in the Docker container:

```
sudo docker run -it --entrypoint=/bin/sh zadam/trilium:0.63-latest
```
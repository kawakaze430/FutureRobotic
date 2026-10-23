FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 gcc g++ openjdk-17-jdk-headless && apt-get clean && find /var/lib/apt/lists -type f -delete
COPY runner/images/entry.py /opt/runner/entry.py
RUN mkdir -p /work && chmod 1777 /work
USER 10001:10001
WORKDIR /work
ENTRYPOINT ["python3","-I","/opt/runner/entry.py"]

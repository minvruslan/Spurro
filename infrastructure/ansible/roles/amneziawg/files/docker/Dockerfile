FROM amneziavpn/amneziawg-go:2.0.0

RUN apk add --no-cache jq

# Must be in sync with:
# infrastructure/src/common/constants/docker/DOCKER_CONTAINER_WITH_AMNEZIAWG.ts
VOLUME /opt/amnezia/awg
WORKDIR /opt/amnezia/awg

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
COPY client-registry.sh /usr/local/bin/client-registry.sh
COPY quic-mimicry.preset /usr/local/share/quic-mimicry.preset
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/client-registry.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

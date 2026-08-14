ARG VERSION
FROM amneziavpn/amneziawg-go:${VERSION}

ARG STATE_DIRECTORY
ARG INTERFACE
ENV STATE_DIRECTORY=${STATE_DIRECTORY} \
    INTERFACE=${INTERFACE} \
    CONFIGURATION_FILE=${STATE_DIRECTORY}/${INTERFACE}.conf \
    CONFIGURATION_SOURCE_FILE=/run/amneziawg2/${INTERFACE}.conf \
    SERVER_PUBLIC_KEY_FILE=${STATE_DIRECTORY}/server_public.key

VOLUME ${STATE_DIRECTORY}
WORKDIR ${STATE_DIRECTORY}

COPY entrypoint.sh apply-peers.sh delete-accesses.sh list-allowed-ips.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/apply-peers.sh \
    /usr/local/bin/delete-accesses.sh /usr/local/bin/list-allowed-ips.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

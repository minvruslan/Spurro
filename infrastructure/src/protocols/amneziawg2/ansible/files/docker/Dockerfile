ARG VERSION
FROM amneziavpn/amneziawg-go:${VERSION}

ARG STATE_DIRECTORY
ARG INTERFACE
ENV STATE_DIRECTORY=${STATE_DIRECTORY} \
    INTERFACE=${INTERFACE} \
    CONFIGURATION_FILE=${STATE_DIRECTORY}/${INTERFACE}.conf \
    SERVER_PRIVATE_KEY_FILE=${STATE_DIRECTORY}/server_private.key \
    SERVER_PRIVATE_KEY_SOURCE_FILE=/run/amneziawg2/server_private.key \
    SERVER_PUBLIC_KEY_FILE=${STATE_DIRECTORY}/server_public.key \
    OBFUSCATION_FILE=${STATE_DIRECTORY}/obf.env \
    MIMICRY_PRESET_FILE=/usr/local/share/quic-mimicry.preset

VOLUME ${STATE_DIRECTORY}
WORKDIR ${STATE_DIRECTORY}

COPY entrypoint.sh create-access.sh delete-accesses.sh list-allowed-ips.sh /usr/local/bin/
COPY quic-mimicry.preset /usr/local/share/quic-mimicry.preset
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/create-access.sh \
    /usr/local/bin/delete-accesses.sh /usr/local/bin/list-allowed-ips.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

FROM alpine:3.20

RUN apk add --no-cache ansible-core openssh-client sshpass

RUN ansible-galaxy collection install \
    devsec.hardening:10.6.0 \
    ansible.posix:2.2.1 \
    community.general:12.6.2

# ADR-0001: Docker Compose before K3s

**Status:** Accepted

The target server already runs Docker workloads and an edge proxy. The first Clear Pill slice therefore uses an isolated Compose project instead of installing K3s on the same host.

This reduces port, networking, storage and operational conflicts while preserving OCI-container portability. K3s/Helm becomes appropriate when there is a second node, a dedicated host, or a demonstrated scheduling/availability requirement.

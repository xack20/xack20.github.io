---
title: "Two small fixes to Hyperledger fabric-samples"
summary: "Two small merged fixes to the official Hyperledger Fabric samples: a one-line fix to the test network's setup script in 2022, and a wrong Maven groupId in a Java sample in 2020."
meta: "Open source · Hyperledger Fabric · 2020, 2022"
org: "Open source"
years: "2020, 2022"
role: "Contributor"
group: open-source
order: 6
page: false
stack: [Hyperledger Fabric, Bash, Maven]
links:
  - { label: "PR #748 (2022)", href: "https://github.com/hyperledger/fabric-samples/pull/748" }
  - { label: "PR #134 (2020)", href: "https://github.com/hyperledger/fabric-samples/pull/134" }
published: 2026-10-09
---

Two small fixes, both merged. In 2022 the test network's environment script pointed Org2 at Org1's TLS certificate, and I corrected that one line. In 2020 a Java sample used the wrong Maven groupId for its Fabric gateway dependency, and I fixed it.

/**
 * Anatomy Concept Templates (Advanced Masterpiece Library)
 * Pre-crafted physical metaphors for complex computing, distributed systems,
 * hardware architecture, and cryptographic concepts.
 * Follows the core Anatomy craft rule: "The object is the explanation."
 */

export const CONCEPT_TEMPLATES = [
  {
    id: "token-bucket",
    title: "Token Bucket Rate Limiter",
    category: "Distributed Systems & Networking",
    summary: "일정 주기로 생성되는 토큰을 버킷에 채우고 요청마다 토큰을 소모하여 트래픽 버스트를 완충하는 알고리즘",
    metaphor: "정밀 황동 토큰 디스크가 일정 클럭 속도로 수직 아크릴 튜브로 떨어지고, 하단 공압 댐퍼 서보 셔터가 네트워크 패킷 버스트당 토큰을 배출하며 유량 다이얼을 갱신하는 정밀 분배 장치.",
    partsCount: 64,
    specs: {
      capacity: 10,
      refillRate: "2.0 tokens/sec",
      burstAllowance: "150%",
      springTension: "320 N/m",
      flowMetric: "Packet Inflow / Drop Gate"
    },
    defaultParams: {
      tokens: 6,
      maxTokens: 10,
      inflowRate: 2,
      burstFactor: 1.5,
      pressure: 2.8
    },
    readoutFormat: (val) => `Bucket: ${val.tokens.toFixed(1)} / ${val.maxTokens} tokens · Flow: ${(val.pressure * 14.7).toFixed(1)} psi · Status: ${val.tokens >= 1 ? "PASSED (200 OK)" : "RATE_LIMITED (429)"}`,
    cardFig: "Fig 1",
    cardTitle: "Token bucket rate limiter",
    hint: "마우스를 좌우로 움직여 트래픽 버스트 조절 · 클릭/스페이스로 토큰 수동 투입"
  },
  {
    id: "lru-cache",
    title: "LRU Cache Memory Rack",
    category: "Operating Systems & Memory",
    summary: "최근에 가장 적게 사용된 엔트리를 우선적으로 제거하여 고속 캐시 공간을 유지하는 알고리즘",
    metaphor: "최신도 순서대로 정렬된 알루미늄 메모리 블록 트레이. 랙-앤-피니언 갠트리 캐리지가 Hot 블록을 선두로 재배치하고 가장 오래된 Cold 블록을 축출 호퍼로 밀어내는 기계식 셔틀.",
    partsCount: 78,
    specs: {
      slots: 4,
      busSpeed: "100 MHz Ultra-Wide",
      gripperForce: "45 N Electro-Mag",
      evictionPolicy: "Strict LRU Order",
      hitRatio: "94.2%"
    },
    defaultParams: {
      activeSlot: 2,
      hitRate: 0.94,
      evictions: 12,
      gantryX: 120
    },
    readoutFormat: (val) => `Slot [${val.activeSlot + 1}/4] Active · LRU Gantry: ${val.activeSlot === 3 ? "CACHE_HIT (L1 Fast)" : "CACHE_MISS_EVICT"} · Hit Rate: 94.2% · Bus: READY`,
    cardFig: "Fig 2",
    cardTitle: "LRU cache gantry shuttle",
    hint: "슬롯 위로 마우스를 슬라이드하여 캐시 엔트리 조회 및 갠트리 이동"
  },
  {
    id: "database-wal",
    title: "Database Write-Ahead Logging Engine",
    category: "Database Engines & Storage",
    summary: "트랜잭션의 영속성과 ACID 원자성을 위해 메인 디스크 수정 전 순차 로그 파일에 선행 기록하는 엔진",
    metaphor: "회전하는 인덱스 데이터 플래터 앞을 달리는 연속 순차 펀치 테이프 릴. 펀치 바늘이 LSN(Log Sequence Number)을 각인하고 fsync 동기화가 확인된 후에만 메인 디스크 플래터에 커밋하는 동기화 장비.",
    partsCount: 82,
    specs: {
      syncMode: "fsync-always (O_DIRECT)",
      lsn: 1048576,
      tapeFeed: "12 mm/s Heavy-Duty",
      diskSpin: "7200 rpm Balanced",
      durability: "100% Zero-Loss"
    },
    defaultParams: {
      lsn: 1048576,
      tapeOffset: 45,
      headPressure: 85,
      committed: true
    },
    readoutFormat: (val) => `LSN: 0x${Math.round(val.lsn).toString(16).toUpperCase()} · Sync: FSYNC_OK · Punch Head: ${val.headPressure.toFixed(0)} kPa · Durability: 100%`,
    cardFig: "Fig 3",
    cardTitle: "Write-ahead logging recorder",
    hint: "마우스 위치에 따라 순차 트랜잭션 로그가 전진하고 디스크 커밋 바늘이 동기화됩니다"
  },
  {
    id: "gpu-pipeline",
    title: "GPU Shader Execution Pipeline",
    category: "Computer Graphics & Hardware",
    summary: "버텍스 셰이딩, 래스터라이징, 프래그먼트 셰이딩으로 이어지는 하드웨어 그래픽스 렌더링 파이프라인",
    metaphor: "원시 다각형 와이어프레임 블랭크가 정밀 프레스(Vertex Stage), 미세 핀 매트릭스 그리드(Rasterizer), 4색 안료 분사 노즐(Fragment Stage)을 순차 통과하는 3단 계단식 제조 갠트리.",
    partsCount: 94,
    specs: {
      stages: "Vertex -> Raster -> Fragment",
      warpSize: 32,
      clockRate: "2.4 GHz Tensor Cores",
      throughput: "144 Gpixels/s",
      dieTemp: "68.5 °C"
    },
    defaultParams: {
      stageProgress: 0.65,
      activeWarps: 28,
      fillRate: 144,
      dieTemp: 68.5
    },
    readoutFormat: (val) => `Pipeline: ${(val.stageProgress * 100).toFixed(0)}% · Active Warps: ${Math.round(val.activeWarps)}/32 · Throughput: ${val.fillRate} Gpix/s · Temp: ${val.dieTemp.toFixed(1)}°C`,
    cardFig: "Fig 4",
    cardTitle: "GPU graphics shader pipeline",
    hint: "마우스를 좌우로 드래그하여 지오메트리 큐브를 파이프라인 단계별로 통과시킵니다"
  },
  {
    id: "kafka-bus",
    title: "Kafka Event Stream Partition Bus",
    category: "Message Queues & Streaming",
    summary: "대용량 실시간 이벤트 스트림을 여러 파티션으로 분산 저장하고 독립된 컨슈머 오프셋으로 추적하는 시스템",
    metaphor: "상부 호퍼에서 굴러떨어지는 볼 베어링 메시지가 3개의 파티션 슈트 레일로 분기되고, 각 레일 끝의 래칫 스텝퍼 휠이 컨슈머 오프셋을 순차적으로 전진시키는 분류 기계.",
    partsCount: 72,
    specs: {
      partitions: 3,
      ackMode: "all (ISR Quorum)",
      lagOffset: 0,
      retention: "7 days Log Segment",
      ingestRate: "350 msg/sec"
    },
    defaultParams: {
      partition: 1,
      offset: 4892,
      flowRate: 350,
      bufferFill: 0.42
    },
    readoutFormat: (val) => `Partition: P-${val.partition} · Offset: ${Math.round(val.offset)} · Ingest: ${Math.round(val.flowRate)} msg/s · Consumer Lag: 0`,
    cardFig: "Fig 5",
    cardTitle: "Distributed partition event bus",
    hint: "마우스 위치에 따라 파티션 레일이 선택되고 컨슈머 오프셋 휠이 회전합니다"
  },
  {
    id: "zk-lock",
    title: "Zero-Knowledge Proof Mystery Lock",
    category: "Cryptography & Security",
    summary: "비밀값(Witness) 자체를 노출하지 않고도 명제와 수식의 유효성만을 증명하는 영지식 증명 암호학 메커니즘",
    metaphor: "내부에 은폐된 미로 핀 텀블러 실린더. 편심 캠이 회전하면서 비밀 키의 홈 깊이를 외부에 보이지 않고도 대수적 다항식 제약 조건이 100% 일치함을 기계적으로 확인하는 비밀 락 장비.",
    partsCount: 68,
    specs: {
      curve: "BLS12-381 / BN254",
      constraints: "4096 R1CS Equations",
      soundness: "2^-128 Non-Interactive",
      proofSize: "192 bytes Succinct"
    },
    defaultParams: {
      rotation: 45,
      pinAlignment: 0.98,
      verified: true
    },
    readoutFormat: (val) => `Cam Angle: ${val.rotation.toFixed(1)}° · Constraint: ${val.verified ? "SATISFIED (VALID)" : "SEARCHING..."} · Soundness: 2^-128`,
    cardFig: "Fig 6",
    cardTitle: "Zero-knowledge verification lock",
    hint: "다이얼 크라운을 회전시켜 비밀 위트니스 캠과 공용 제약 핀을 일치시키세요"
  },
  {
    id: "raft-consensus",
    title: "Raft Consensus Heartbeat Cluster",
    category: "Distributed Consensus",
    summary: "분산 노드 간의 상태 머신 복제와 리더 선출, 하트비트 동기화를 보장하는 합의 알고리즘",
    metaphor: "3개의 기계식 실린더 노드가 원형 베이스에 배치되고, 중앙의 리더 노드에서 뻗어나온 펄스 캠축이 일정한 틱 속도로 팔로워 실린더의 피스톤을 동기화시키는 합의 링.",
    partsCount: 86,
    specs: {
      quorum: "2/3 Nodes Majority",
      term: 14,
      heartbeatInterval: "150 ms",
      stateMachine: "Strict Append-Entries"
    },
    defaultParams: {
      leaderNode: 1,
      term: 14,
      quorumSync: true,
      pulseSpeed: 1.0
    },
    readoutFormat: (val) => `Term: ${val.term} · Leader: Node-A (Active) · Quorum: 3/3 Replicated · Heartbeat: 150ms · State: COMMITTED`,
    cardFig: "Fig 7",
    cardTitle: "Raft state machine replication ring",
    hint: "마우스를 이동하여 네트워크 지연을 시뮬레이션하고 합의 펄스를 확인하세요"
  },
  {
    id: "lsm-tree",
    title: "LSM-Tree MemTable & SSTable Compactor",
    category: "Storage Systems",
    summary: "메모리 상의 MemTable에 고속 순차 쓰기 후 불변 SSTable로 플러시하고 계층별 병합(Compaction)하는 스토리지 엔진",
    metaphor: "상단의 회전식 황동 인메모리 버퍼 휠에서 데이터 블록이 고속 적재되고, 한계에 도달하면 하단 계층형 슬라이딩 플레이트(Level 0/1/2)로 압축 프레스가 눌러 병합하는 계층 분쇄기.",
    partsCount: 92,
    specs: {
      writeAmplification: "1.8x Tiered",
      memtableSize: "64 MB Ring",
      compactionRatio: "10:1 Ratio",
      storageEngine: "LSM Log-Structured"
    },
    defaultParams: {
      level: 1,
      compacting: false,
      flushProgress: 0.72
    },
    readoutFormat: (val) => `MemTable: ${(val.flushProgress * 100).toFixed(0)}% Fill · Active Compaction: Level-${val.level} -> ${val.level + 1} · IOPS: 48,000`,
    cardFig: "Fig 8",
    cardTitle: "LSM-Tree compaction press",
    hint: "마우스로 MemTable 유입량을 조절하여 SSTable 플러시 및 계층 압축을 유도하세요"
  },
  {
    id: "transformer-attention",
    title: "Transformer Multi-Head Attention Matrix",
    category: "Artificial Intelligence & LLM",
    summary: "Query, Key, Value 벡터의 내적과 소프트맥스 행렬곱을 통해 시퀀스 내 토큰 간의 맥락적 가중치를 계산하는 어텐션 엔진",
    metaphor: "3중 가이드 레일을 따라 이동하는 Q/K/V 프리즘 갠트리와, 그 아래 교차 지점에서 빛을 굴절시켜 가중치 스팟을 형성하는 다이아몬드 편광 매트릭스 플레이트.",
    partsCount: 98,
    specs: {
      heads: 8,
      dModel: 512,
      contextWindow: "128k Tokens",
      attentionKernel: "FlashAttention-3"
    },
    defaultParams: {
      headIndex: 2,
      sparsity: 0.88,
      temperature: 0.7
    },
    readoutFormat: (val) => `Head: [3/8] · Softmax Temperature: ${val.temperature.toFixed(2)} · Attention Sparsity: ${(val.sparsity * 100).toFixed(0)}% · Kernel: FlashAttention-3`,
    cardFig: "Fig 9",
    cardTitle: "Multi-head attention optical prism",
    hint: "마우스 위치로 토큰 간의 쿼리-키 교차점을 이동시켜 어텐션 스팟을 점등합니다"
  }
];

export function findTemplate(id) {
  return CONCEPT_TEMPLATES.find(t => t.id === id) || CONCEPT_TEMPLATES[0];
}

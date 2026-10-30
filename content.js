/* ==========================================================================
   포트폴리오 내용 — 편집 모드(주소 끝에 ?edit)에서 고치고 [저장]하면 이 파일이 다시 써집니다.
   직접 고쳐도 됩니다. ⟪ ⟫ 표시는 아직 채우지 않은 자리입니다.
   media: { type: "video" | "image" | "images", src: "assets/…" }
   ========================================================================== */

window.PORTFOLIO = {
  "meta": {
    "year": "2026",
    "name": "정시안",
    "nameEn": "Jung Sian",
    "role": "Game Designer",
    "roleKo": "게임 콘텐츠 기획, 시스템 기획",
    "heroImage": "assets/mvoxhl71ae7-1161e04c-8088-4c28-9047-e99977.png",
    "slideSeconds": 5,
    "email": "s1an011109@gmail.com",
    "keywords": [
      "서브컬처 RPG",
      "캐릭터 연출",
      "필드/수집 콘텐츠",
      "콘텐츠 검수"
    ],
    "headline": [
      "만든 것을 사람들이 즐기는\n순간이 좋아 게임을 만듭니다."
    ],
    "intro": "보드게임의 콘셉트와 규칙을 기획하고\n제작부터 배송까지 맡아 516명의 후원자에게 전달했습니다.\n\n「카오스 제로 나이트메어」에서는 전투의 등장 시점과 적 구성을 정하고\n캐릭터의 감정을 보여주는 연출을 제안해 반영했습니다.",
    "links": []
  },
  "glance": [
    {
      "value": "516",
      "unit": "명",
      "label": "보드게임 후원자",
      "sub": "「플레이어님, 어느 성좌가 좋아?」 팀장"
    },
    {
      "value": "1,310",
      "unit": "만원",
      "label": "크라우드펀딩 후원금",
      "sub": "텀블벅, 기획부터 배송까지 총괄"
    },
    {
      "value": "6",
      "unit": "개월",
      "label": "라이브 타이틀 개발 참여",
      "sub": "슈퍼크리에이티브 콘텐츠 부서 인턴"
    }
  ],
  "files": {
    "summary": {
      "url": "#",
      "pdf": "#",
      "pages": "⟪8⟫",
      "readTime": "⟪3분⟫",
      "teaser": "카오스 제로 나이트메어, 보드게임, 졸업작품",
      "hook": "바쁘시다면 이것만 보셔도 됩니다",
      "cover": null
    },
    "detail": {
      "url": "#",
      "pdf": "#",
      "pages": "⟪23⟫",
      "readTime": "⟪12분⟫",
      "teaser": "프로젝트마다 무엇을 제안했고 어떻게 반영됐는지",
      "hook": "어떻게 설득했는지까지 전부 담았습니다",
      "cover": null
    }
  },
  "works": [
    {
      "id": "czn",
      "featured": true,
      "title": "카오스 제로 나이트메어",
      "genre": "로그라이크 RPG / 서브컬처 모바일",
      "role": "콘텐츠 기획 인턴",
      "period": "2025.06 — 2025.12",
      "team": "스마일게이트 슈퍼크리에이티브",
      "status": "출시 2025.10.22",
      "tags": [
        "콘텐츠",
        "캐릭터 연출",
        "검수"
      ],
      "oneLine": "감정과 관계를 보여 주는 SD 연출이 왜 필요한지 설득해 게임에 넣었습니다.\n배드엔딩 CG는 거대 괴물에 미소녀의 모습을 섞자고 제안했고, AD 검토 후 반영됐습니다.\n출시 후 이 연출은 유저가 만든 이모티콘과 공식 4컷 만화에도 쓰였습니다.",
      "media": {
        "type": "image",
        "src": "assets/mvovsu2ndn2-ogtag-1200-default.jpg"
      },
      "tasks": [
        "나르쟈 트라우마 코드 일부 구간 기획",
        "엘리시온 SD 감정 연출 제안과 제작 비용 협의",
        "엔딩 일러스트 표현 방향 제안",
        "프로그래머, 아트 PM과 함께 프랍 그림자 데이터 전체를 정리하고 출력 방식 개선",
        "미확인 구역의 이벤트, 연출, 조건, 보상을 검수하고 기획서와 다르게 구현되거나 빠진 부분 수정"
      ],
      "links": [
        {
          "label": "공식 사이트",
          "url": "https://chaoszeronightmare.onstove.com/ko/promotion/anniv/261007"
        }
      ],
      "blocks": [],
      "facts": [],
      "steps": [
        {
          "label": "상황",
          "text": "트라우마 코드는 캐릭터의 숨겨진 과거를 다루는 멀티엔딩 서브 스토리입니다. 나르쟈와 의식이 연결된 비룡 '엘리시온'의 SD 리소스가 제작 비용 때문에 빠질 상황이었습니다. 대형 괴물로 변하는 엔딩 일러스트는 미소녀 캐릭터의 매력보다 위압감이 앞섰습니다."
        },
        {
          "label": "제안",
          "text": "아트 킥오프에서 엘리시온이 감정 표현이 적은 나르쟈의 속마음을 대신 보여 줄 수 있다고 설명하고, SD 표정과 동작을 만들자고 설득했습니다. 엔딩은 변신 장면의 특징은 살리되 미소녀 콘셉트로 바꾸자고 제안했습니다."
        },
        {
          "label": "반응",
          "text": "두 제안 모두 반영됐습니다. 출시 후 나르쟈와 엘리시온이 함께 나오는 유저 제작 이모티콘이 쓰였고 배드엔딩의 나르쟈는 '거다이 나르쟈', '밥줘' 밈으로 퍼졌습니다."
        }
      ],
      "tasksTitle": "핵심 성과"
    },
    {
      "id": "seongjwa",
      "featured": true,
      "title": "플레이어님, 어느 성좌가 좋아?",
      "genre": "보드게임 / 텀블벅 크라우드펀딩",
      "role": "팀장, 기획부터 배송까지 총괄",
      "period": "2022",
      "team": "⟪0인 팀⟫",
      "status": "펀딩 성공, 출시",
      "tags": [
        "보드게임",
        "팀장",
        "출시"
      ],
      "oneLine": "팀장으로 기획부터 배송까지 맡아 내놓은 보드게임입니다.\n후원자 516명에게 13,098,000원을 모아 목표의 727%를 달성했습니다.",
      "media": {
        "type": "image",
        "src": "assets/mvoxnaxpbpz-eyjidwnrzxqioij0dw1ibgj1zy1pbw.webp"
      },
      "tasks": [
        "팀장으로 기획, 제작, 펀딩, 배송까지 전 과정 총괄",
        "⟪맡은 기획 업무⟫",
        "2022 보드게임 페스타 오프라인 전시"
      ],
      "links": [
        {
          "label": "텀블벅 페이지",
          "url": "https://tumblbug.com/constellation_want_die"
        }
      ],
      "blocks": [],
      "steps": [
        {
          "label": "시작",
          "text": "⟪어떤 게임을 만들고 싶었고 무엇이 어려웠는지⟫"
        },
        {
          "label": "판단",
          "text": "⟪규칙, 콘셉트, 팀 운영에서 내린 판단⟫"
        },
        {
          "label": "결과",
          "text": "후원자 516명, 후원금 13,098,000원으로 펀딩에 성공해 출시했고 2022 보드게임 페스타에 전시했습니다."
        }
      ]
    },
    {
      "id": "luka",
      "featured": true,
      "title": "LUKA: AZURE FIELD",
      "genre": "졸업작품 / ⟪장르, 엔진⟫",
      "role": "NPC 노아 콘텐츠 기획",
      "period": "2024",
      "team": "⟪0인 팀⟫",
      "status": "BIC 2024 루키 전시",
      "tags": [
        "필드",
        "수집",
        "NPC"
      ],
      "oneLine": "2024년 청강문화산업대학교 졸업작품입니다.\n필드에서 꽃을 찾아 NPC에게 가져가면 강화를 받는 탐색, 수집, 강화 콘텐츠를 기획했습니다.",
      "media": {
        "type": "image",
        "src": "assets/mvoye7gakrh-1732259293255.png"
      },
      "tasks": [
        "NPC 노아 콘텐츠 기획",
        "필드 수집물 배치와 강화 보상 설계",
        "⟪기타 업무⟫"
      ],
      "links": [],
      "steps": [
        {
          "label": "배경",
          "text": "⟪필드 탐색에 동기가 부족했던 점 등 이 콘텐츠가 필요했던 이유⟫"
        },
        {
          "label": "구조",
          "text": "필드 곳곳에서 꽃을 모아 NPC 노아에게 건네면 강화를 받도록 해서 탐색, 수집, 강화가 한 흐름으로 이어지게 했습니다."
        },
        {
          "label": "전시",
          "text": "BIC 2024 루키 부문 온라인/오프라인 전시, 청강 크로니클 2024 전시"
        },
        {
          "label": "반응",
          "text": "⟪플레이테스트 반응이나 수치⟫"
        }
      ]
    },
    {
      "id": "voice",
      "featured": false,
      "title": "사랑을 위해서라면 목소리를 내야해!",
      "genre": "미소녀 연애 시뮬레이션",
      "role": "⟪역할⟫",
      "period": "2021",
      "team": "4인 프로젝트",
      "status": "알발 페스타 1등",
      "tags": [
        "서브컬처",
        "연애 시뮬레이션"
      ],
      "oneLine": "교내 프로젝트 대회인 제2회 알발 페스타에서 1등을 받은 미소녀 연애 시뮬레이션입니다.",
      "media": {
        "type": "image",
        "src": "assets/mvoyhx89ls7-1.png"
      },
      "tasks": [
        "⟪맡은 업무⟫"
      ],
      "links": [],
      "steps": [
        {
          "label": "수상",
          "text": "청강문화산업대학교 제2회 알발 페스타 1등"
        }
      ]
    },
    {
      "id": "etc",
      "featured": false,
      "title": "기타 프로젝트",
      "genre": "산학 / 공모 / VR",
      "role": "⟪역할⟫",
      "period": "2022",
      "team": "KT, 넥슨 등",
      "status": "산학 협력",
      "tags": [
        "산학",
        "MOD",
        "VR"
      ],
      "oneLine": "KT 산학 프로젝트, 넥슨 MOD 게임 개발, 그리고 알발 페스타 2등을 받은 VR 프로젝트입니다.",
      "media": null,
      "tasks": [
        "2022 KT 산학 프로젝트 참여",
        "2022 넥슨 MOD 게임 개발 프로젝트 참여",
        "VR 프로젝트로 제3회 알발 페스타 2등"
      ],
      "links": [],
      "steps": [
        {
          "label": "수상",
          "text": "제3회 알발 페스타 2등 (VR)"
        }
      ]
    }
  ],
  "gameLogs": [
    {
      "title": "승리의 여신: 니케",
      "genre": "서브컬처 RPG",
      "platform": "모바일/PC",
      "period": "⟪2022 —⟫",
      "stats": [
        {
          "label": "지휘관 레벨",
          "value": "285"
        },
        {
          "label": "스쿼드 전투력",
          "value": "260K"
        }
      ],
      "insight": "⟪니케를 하며 기획자로서 본 것 한 줄 (NORMAL 캠페인 26-33 진행 중)⟫",
      "tags": [
        "캐릭터 매력",
        "수집/육성"
      ],
      "media": null
    },
    {
      "title": "명조: 워더링 웨이브",
      "genre": "서브컬처 RPG",
      "platform": "모바일/PC",
      "period": "⟪2024 —⟫",
      "stats": [
        {
          "label": "연각 레벨",
          "value": "52"
        },
        {
          "label": "솔라리스 랭크",
          "value": "6"
        }
      ],
      "insight": "⟪오픈 필드 탐색과 수집에서 본 것 한 줄⟫",
      "tags": [
        "필드 탐색",
        "수집"
      ],
      "media": null
    },
    {
      "title": "블루 아카이브",
      "genre": "서브컬처 RPG",
      "platform": "모바일/PC",
      "period": "⟪2021 —⟫",
      "stats": [
        {
          "label": "선생 레벨",
          "value": "60"
        },
        {
          "label": "노말 스테이지",
          "value": "올 클리어"
        }
      ],
      "insight": "⟪스토리와 캐릭터 연출에서 본 것 한 줄⟫",
      "tags": [
        "스토리 연출",
        "캐릭터"
      ],
      "media": {
        "type": "image",
        "src": "assets/mvtpv54o11s-og-ko.jpg"
      }
    },
    {
      "title": "사이퍼즈",
      "genre": "",
      "platform": "",
      "period": "",
      "stats": [
        {
          "label": "기록",
          "value": ""
        },
        {
          "label": "기록",
          "value": ""
        }
      ],
      "insight": "",
      "tags": [],
      "media": null
    },
    {
      "title": "Final Fantasy XIV",
      "genre": "",
      "platform": "",
      "period": "",
      "stats": [
        {
          "label": "기록",
          "value": ""
        },
        {
          "label": "기록",
          "value": ""
        }
      ],
      "insight": "",
      "tags": [],
      "media": null
    }
  ],
  "resume": [
    {
      "group": "경력과 활동",
      "items": [
        {
          "period": "2025.06 — 2025.12",
          "title": "스마일게이트홀딩스 슈퍼크리에이티브 인턴십",
          "desc": "콘텐츠 부서, 「카오스 제로 나이트메어」 출시 (2025.10.22)",
          "badge": "출시"
        },
        {
          "period": "2024",
          "title": "BIC 루키 부문 온라인/오프라인 전시",
          "desc": "졸업작품 「LUKA: AZURE FIELD」"
        },
        {
          "period": "2022, 2024",
          "title": "청강문화산업대학교 크로니클 오프라인 전시",
          "desc": ""
        },
        {
          "period": "2022",
          "title": "보드게임 「플레이어님, 어느 성좌가 좋아?」 크라우드펀딩 성공",
          "desc": "후원자 516명, 1,300만원 달성, 보드게임 페스타 전시",
          "badge": "팀장"
        },
        {
          "period": "2022",
          "title": "넥슨 MOD 게임 개발 프로젝트, KT 산학 프로젝트",
          "desc": ""
        }
      ]
    },
    {
      "group": "수상",
      "items": [
        {
          "period": "2022",
          "title": "제3회 알발 페스타 2등",
          "desc": "청강문화산업대학교, VR 프로젝트",
          "badge": "2등"
        },
        {
          "period": "2021",
          "title": "제2회 알발 페스타 1등",
          "desc": "청강문화산업대학교, 미소녀 연애 시뮬레이션",
          "badge": "1등"
        }
      ]
    },
    {
      "group": "학력",
      "items": [
        {
          "period": "2024 — 2025",
          "title": "청강문화산업대학교 차세대 게임 콘텐츠 학과",
          "desc": "전공심화과정"
        },
        {
          "period": "2021 — 2024",
          "title": "청강문화산업대학교 게임콘텐츠스쿨",
          "desc": ""
        }
      ]
    },
    {
      "group": "도구",
      "items": [
        {
          "period": "Engine",
          "title": "Unreal Engine 5, Unity",
          "desc": ""
        },
        {
          "period": "Work",
          "title": "Excel, PowerPoint, Word, Photoshop, Clip Studio, Blender",
          "desc": ""
        },
        {
          "period": "VCS",
          "title": "Git, SVN",
          "desc": ""
        }
      ]
    }
  ],
  "sections": [],
  "layout": {
    "art": {
      "x": 2.55,
      "y": 2.92
    },
    "note": {
      "x": -3.44,
      "y": 1.44,
      "w": 111.42
    }
  },
  "about": {
    "title": "About Me",
    "photo": null,
    "blocks": [
      {
        "type": "p",
        "text": "⟪어떤 게임을 좋아하고, 어떤 기획자가 되고 싶은지 자유롭게 써 주세요.⟫"
      },
      {
        "type": "p",
        "text": "니케, 에반게리온, 버튜버 피규어와 굿즈를 10개 넘게 모았을 만큼 서브컬처를 좋아합니다. 유저로서 지갑을 연 순간을 기억해 두었다가 기획에 씁니다."
      }
    ],
    "facts": []
  }
};

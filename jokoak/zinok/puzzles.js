/* ZINOK · Mezu Zuzentzailea, jatorrizko puzzleService.ts-tik hartutako pilotu-azpimultzoa.
 * Egiaztapen akademikoa egiteko zain: ez markatu egiaztatutakotzat.
 * Baztertu dira 51–65 aztertu gabeko ariketa aurreratuak eta 66–100 behin-behineko errepikapenak,
 * baita zalantzazko/errore posibleak dituzten lehen mailako hainbat item ere.
 * Jatorria: https://github.com/antoniourutz-dev/zinok/blob/main/src/services/puzzleService.ts
 */
window.ZinokPuzzles=Object.freeze([
  {
    "id": "1",
    "esaldia": "Proiektu berria bultzatu behar dugu.",
    "targets": [
      {
        "klabea": "bultzatu",
        "zuzena": "sustatu",
        "distraktoreak": [
          "baztertu",
          "amaitu",
          "aldatu"
        ]
      }
    ]
  },
  {
    "id": "2",
    "esaldia": "Idazlan hau arteztu behar duzu lehenbailehen.",
    "targets": [
      {
        "klabea": "arteztu",
        "zuzena": "zuzendu",
        "distraktoreak": [
          "hautatu",
          "nahasi",
          "gorde"
        ]
      }
    ]
  },
  {
    "id": "3",
    "esaldia": "Azterketarako ondo prestatu naiz aste honetan.",
    "targets": [
      {
        "klabea": "prestatu",
        "zuzena": "trebatu",
        "distraktoreak": [
          "makaldu",
          "nekatu",
          "aspertu"
        ]
      }
    ]
  },
  {
    "id": "4",
    "esaldia": "Gaixotasunak asko ahuldu du gure aitona zaharra.",
    "targets": [
      {
        "klabea": "ahuldu",
        "zuzena": "makaldu",
        "distraktoreak": [
          "indartu",
          "piztu",
          "hazi"
        ]
      }
    ]
  },
  {
    "id": "5",
    "esaldia": "Tratu txarrak jasan behar izan ditu urteetan.",
    "targets": [
      {
        "klabea": "jasan",
        "zuzena": "nozitu",
        "distraktoreak": [
          "ukatu",
          "erabili",
          "gorde"
        ]
      }
    ]
  },
  {
    "id": "6",
    "esaldia": "Tresna berriek lana erraztu egiten dute beti.",
    "targets": [
      {
        "klabea": "erraztu",
        "zuzena": "samurtu",
        "distraktoreak": [
          "zaildu",
          "nekarazi",
          "moteldu"
        ]
      }
    ]
  },
  {
    "id": "7",
    "esaldia": "Altxorra kobazulo ilun batean gorde zuten.",
    "targets": [
      {
        "klabea": "gorde",
        "zuzena": "ezkutatu",
        "distraktoreak": [
          "erakutsi",
          "saldu",
          "galdu"
        ]
      }
    ]
  },
  {
    "id": "9",
    "esaldia": "Udaletxean eskaera bat aurkeztu dugu gaur goizean.",
    "targets": [
      {
        "klabea": "eskaera",
        "zuzena": "eskabide",
        "distraktoreak": [
          "erantzuna",
          "agurra",
          "galdera"
        ]
      }
    ]
  },
  {
    "id": "11",
    "esaldia": "Ikasi behar duzu, bestela suspenditu egingo duzu.",
    "targets": [
      {
        "klabea": "bestela",
        "zuzena": "osterantzean",
        "distraktoreak": [
          "halaber",
          "berez",
          "jakina"
        ]
      }
    ]
  },
  {
    "id": "12",
    "esaldia": "Fruta asko dago, adibidez sagarrak eta udareak.",
    "targets": [
      {
        "klabea": "adibidez",
        "zuzena": "esaterako",
        "distraktoreak": [
          "ordura arte",
          "horregatik",
          "antza"
        ]
      }
    ]
  },
  {
    "id": "13",
    "esaldia": "Aldaketa honek onura handia ekarriko digu.",
    "targets": [
      {
        "klabea": "onura",
        "zuzena": "probetxu",
        "distraktoreak": [
          "kaltea",
          "traba",
          "zorra"
        ]
      }
    ]
  },
  {
    "id": "14",
    "esaldia": "Herrian uraren gabezia nabaria da uda honetan.",
    "targets": [
      {
        "klabea": "gabezia",
        "zuzena": "falta",
        "distraktoreak": [
          "ugaritasuna",
          "poza",
          "prezioa"
        ]
      }
    ]
  },
  {
    "id": "15",
    "esaldia": "Joan zenean, bidenabar, ogia erosi zuen denda zaharrean.",
    "targets": [
      {
        "klabea": "bidenabar",
        "zuzena": "bide batez",
        "distraktoreak": [
          "berandu",
          "nekerik gabe",
          "agurtu gabe"
        ]
      }
    ]
  },
  {
    "id": "16",
    "esaldia": "Aukera hori erabili behar dugu aurrera egiteko.",
    "targets": [
      {
        "klabea": "erabili",
        "zuzena": "baliatu",
        "distraktoreak": [
          "baztertu",
          "utzi",
          "ahaztu"
        ]
      }
    ]
  },
  {
    "id": "18",
    "esaldia": "Motorra abiarazi du gidariak bidaia hasteko.",
    "targets": [
      {
        "klabea": "abiarazi",
        "zuzena": "martxan jarri",
        "distraktoreak": [
          "gelditu",
          "konpondu",
          "saldu"
        ]
      }
    ]
  },
  {
    "id": "22",
    "esaldia": "Euria ari du, horregatik gelditu gara etxean.",
    "targets": [
      {
        "klabea": "horregatik",
        "zuzena": "hori dela eta",
        "distraktoreak": [
          "halaber",
          "izenez",
          "ordutik"
        ]
      }
    ]
  },
  {
    "id": "24",
    "esaldia": "Dokumentu garrantzitsu hau sinatu behar duzu.",
    "targets": [
      {
        "klabea": "sinatu",
        "zuzena": "izenpetu",
        "distraktoreak": [
          "irakurri",
          "idatzi",
          "gorde"
        ]
      }
    ]
  },
  {
    "id": "25",
    "esaldia": "Zuk behintzat badakizu zer egin behar den.",
    "targets": [
      {
        "klabea": "behintzat",
        "zuzena": "bederen",
        "distraktoreak": [
          "soilik",
          "gainera",
          "beharbada"
        ]
      }
    ]
  },
  {
    "id": "27",
    "esaldia": "Mesedez, gerturatu koadroa argira hobeto ikusteko.",
    "targets": [
      {
        "klabea": "gerturatu",
        "zuzena": "hurbildu",
        "distraktoreak": [
          "urrundu",
          "ezkutatu",
          "igo"
        ]
      }
    ]
  },
  {
    "id": "28",
    "esaldia": "Azkarra da umea eta, halaber, oso langilea.",
    "targets": [
      {
        "klabea": "halaber",
        "zuzena": "gainera",
        "distraktoreak": [
          "bestela",
          "orduan",
          "soilik"
        ]
      }
    ]
  },
  {
    "id": "29",
    "esaldia": "Ni banoa, zu aldiz hemen gelditu zara bakarrik.",
    "targets": [
      {
        "klabea": "aldiz",
        "zuzena": "ostera",
        "distraktoreak": [
          "beraz",
          "hala ere",
          "agian"
        ]
      }
    ]
  },
  {
    "id": "31",
    "esaldia": "Begiarekin keinu bat egin dit urrunetik.",
    "targets": [
      {
        "klabea": "keinu",
        "zuzena": "imintzio",
        "distraktoreak": [
          "begirada",
          "irribarrea",
          "oihua"
        ]
      }
    ]
  },
  {
    "id": "32",
    "esaldia": "Taldeen arteko lehia oso gogorra da txapelketan.",
    "targets": [
      {
        "klabea": "lehia",
        "zuzena": "norgehiagoka",
        "distraktoreak": [
          "laguntasuna",
          "bakea",
          "jolasa"
        ]
      }
    ]
  },
  {
    "id": "34",
    "esaldia": "Hori zure ardura dela uste dut, ez nirea.",
    "targets": [
      {
        "klabea": "ardura",
        "zuzena": "erantzukizun",
        "distraktoreak": [
          "aukera",
          "eskubidea",
          "zalantza"
        ]
      }
    ]
  },
  {
    "id": "36",
    "esaldia": "Gizon burutsua dela dirudi bere hitzak entzunda.",
    "targets": [
      {
        "klabea": "burutsua",
        "zuzena": "adimintsua",
        "distraktoreak": [
          "tuntuna",
          "indartsua",
          "atsegina"
        ]
      }
    ]
  },
  {
    "id": "37",
    "esaldia": "Lana amaitu dugu azkenean, goazen etxera.",
    "targets": [
      {
        "klabea": "amaitu",
        "zuzena": "bukatu",
        "distraktoreak": [
          "hasi",
          "utzi",
          "nahasi"
        ]
      }
    ]
  },
  {
    "id": "38",
    "esaldia": "Autoa geldotu egin da aldapa gora doanean.",
    "targets": [
      {
        "klabea": "geldotu",
        "zuzena": "moteldu",
        "distraktoreak": [
          "bizkortu",
          "piztu",
          "handitu"
        ]
      }
    ]
  },
  {
    "id": "42",
    "esaldia": "Urte horretan janari eskasia egon zen munduan.",
    "targets": [
      {
        "klabea": "eskasia",
        "zuzena": "gabezia",
        "distraktoreak": [
          "ugaritasuna",
          "prezioa",
          "zoriona"
        ]
      }
    ]
  },
  {
    "id": "43",
    "esaldia": "Azaldu iezadazu zehazki zer gertatu den.",
    "targets": [
      {
        "klabea": "zehazki",
        "zuzena": "zehatz-mehatz",
        "distraktoreak": [
          "gainetik",
          "poliki",
          "agian"
        ]
      }
    ]
  },
  {
    "id": "44",
    "esaldia": "Etxe zaharra berritu dute guztiz herri erdialdean.",
    "targets": [
      {
        "klabea": "berritu",
        "zuzena": "berriztatu",
        "distraktoreak": [
          "saldu",
          "bota",
          "margotu"
        ]
      }
    ]
  },
  {
    "id": "45",
    "esaldia": "Etsaia menderatu dute guduan armada indartsuek.",
    "targets": [
      {
        "klabea": "menderatu",
        "zuzena": "menperatu",
        "distraktoreak": [
          "askatu",
          "lagundu",
          "maitatu"
        ]
      }
    ]
  },
  {
    "id": "46",
    "esaldia": "Bidean traba asko aurkitu ditugu gaur goizean.",
    "targets": [
      {
        "klabea": "traba",
        "zuzena": "eragozpen",
        "distraktoreak": [
          "laguntza",
          "erraztasuna",
          "bidea"
        ]
      }
    ]
  },
  {
    "id": "47",
    "esaldia": "Sistema berriaren segurtasuna ziurtatu behar dugu.",
    "targets": [
      {
        "klabea": "ziurtatu",
        "zuzena": "bermatu",
        "distraktoreak": [
          "zalantzan jarri",
          "ukatu",
          "nahasi"
        ]
      }
    ]
  },
  {
    "id": "48",
    "esaldia": "Bat-batean argia joan da eta dena ilundu da.",
    "targets": [
      {
        "klabea": "bat-batean",
        "zuzena": "tupustean",
        "distraktoreak": [
          "poliki",
          "orduan",
          "gaur"
        ]
      }
    ]
  },
  {
    "id": "49",
    "esaldia": "Eskura ditugun baliabideak erabiliko ditugu lanean.",
    "targets": [
      {
        "klabea": "baliabideak",
        "zuzena": "bitartekoak",
        "distraktoreak": [
          "arazoak",
          "lagunak",
          "gastuak"
        ]
      }
    ]
  }
]);

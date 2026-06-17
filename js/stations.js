// The 30 stations of the Yamanote Line (山手線), in JY-number order.
// Outer loop runs in ascending JY order; inner loop descends.
// The line is circular: after JY30 (Yūrakuchō) comes JY01 (Tōkyō).
//
// sections — timing data for the scrub bar.
// Each entry: { label, end } where `end` is the cumulative time in seconds
// from the start of the track.
window.YAMANOTE_STATIONS = [
  { jy: "01", name: "Tōkyō",            kanji: "東京",   artwork: "artwork/JY01.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY01-Tokyo-Inner.opus",            outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY01-Tokyo-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 10 }, { label: "Door Chime", end: 14 }, { label: "Ambience", end: 25.5 }, { label: "Announcement", end: 49 }, { label: "Ambience", end: 55 }, { label: "Door Chime", end: 61.5 } ],
      inner: [ { label: "Melody", end: 8.5 }, { label: "Door Chime", end: 12 }, { label: "Ambience", end: 23.5 }, { label: "Announcement", end: 49.5 }, { label: "Ambience", end: 54 }, { label: "Door Chime", end: 61 } ]
    }
  },
  { jy: "02", name: "Kanda",            kanji: "神田",   artwork: "artwork/JY02.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY02-Kanda-Inner.opus",            outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY02-Kanda-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 11 }, { label: "Door Chime", end: 15 }, { label: "Ambience", end: 21.5 }, { label: "Announcement", end: 51 }, { label: "Ambience", end: 56.8 }, { label: "Door Chime", end: 62 } ],
      inner: [ { label: "Melody", end: 10.5 }, { label: "Door Chime", end: 14.5 }, { label: "Ambience", end: 23 }, { label: "Announcement", end: 63 }, { label: "Ambience", end: 67 }, { label: "Door Chime", end: 74 } ]
    }
  },
  { jy: "03", name: "Akihabara",        kanji: "秋葉原", artwork: "artwork/JY03.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY03-Akihabara-Inner.opus",        outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY03-Akihabara-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 8.5 }, { label: "Door Chime", end: 12.3 }, { label: "Ambience", end: 25.5 }, { label: "Announcement", end: 49.5 }, { label: "Ambience", end: 54 }, { label: "Door Chime", end: 61 } ],
      inner: [ { label: "Melody", end: 8 }, { label: "Door Chime", end: 12 }, { label: "Ambience", end: 19.5 }, { label: "Announcement", end: 43.5 }, { label: "Ambience", end: 49.5 }, { label: "Door Chime", end: 58.3 } ]
    }
  },
  { jy: "04", name: "Okachimachi",      kanji: "御徒町", artwork: "artwork/JY04.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY04-Okachimachi-Inner.opus",      outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY04-Okachimachi-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 10 }, { label: "Door Chime", end: 13.6 }, { label: "Ambience", end: 16.8 }, { label: "Announcement", end: 52.8 }, { label: "Ambience", end: 55.5 }, { label: "Door Chime", end: 62.2 } ],
      inner: [ { label: "Melody", end: 7.8 }, { label: "Door Chime", end: 11.1 }, { label: "Ambience", end: 16 }, { label: "Announcement", end: 45.5 }, { label: "Ambience", end: 48.7 }, { label: "Door Chime", end: 56.49 } ]
    }
  },
  { jy: "05", name: "Ueno",             kanji: "上野",   artwork: "artwork/JY05.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY05-Ueno-Inner.opus",             outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY05-Ueno-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 9 }, { label: "Door Chime", end: 13 }, { label: "Ambience", end: 24 }, { label: "Announcement", end: 38 }, { label: "Ambience", end: 44 }, { label: "Door Chime", end: 49.6 } ],
      inner: [ { label: "Melody", end: 8.5 }, { label: "Door Chime", end: 12 }, { label: "Ambience", end: 21.7 }, { label: "Announcement", end: 44.5 }, { label: "Ambience", end: 49.5 }, { label: "Door Chime", end: 54 }, { label: "Station Announcement", end: 70 } ]
    }
  },
  { jy: "06", name: "Uguisudani",       kanji: "鶯谷",   artwork: "artwork/JY06.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY06-Uguisudani-Inner.opus",       outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY06-Uguisudani-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 11.7 }, { label: "Door Chime", end: 15.5 }, { label: "Ambience", end: 19.8 }, { label: "Announcement", end: 46.3 }, { label: "Ambience", end: 52 }, { label: "Door Chime", end: 57.7 } ],
      inner: [ { label: "Melody", end: 11 }, { label: "Door Chime", end: 14.7 }, { label: "Ambience", end: 24 }, { label: "Announcement", end: 60 }, { label: "Ambience", end: 63 }, { label: "Door Chime", end: 72.8 } ]
    }
  },
  { jy: "07", name: "Nippori",          kanji: "日暮里", artwork: "artwork/JY07.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY07-Nippori-Inner.opus",          outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY07-Nippori-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 12.6 }, { label: "Door Chime", end: 16.3 }, { label: "Ambience", end: 21.6 }, { label: "Announcement", end: 47.6 }, { label: "Ambience", end: 52.5 }, { label: "Door Chime", end: 58.5 }, {label: "Station Announcement", end: 74.3 } ],
      inner: [ { label: "Melody", end: 8 }, { label: "Door Chime", end: 11.6 }, { label: "Ambience", end: 19.3 }, { label: "Announcement", end: 33.5 }, { label: "Ambience", end: 44.2 }, { label: "Door Chime", end: 52 } ]
    }
  },
  { jy: "08", name: "Nishi-Nippori",    kanji: "西日暮里", artwork: "artwork/JY08.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY08-Nishi-Nippori-Inner.opus",    outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY08-Nishi-Nippori-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 9.8 }, { label: "Door Chime", end: 13.3 }, { label: "Ambience", end: 22.3 }, { label: "Announcement", end: 44 }, { label: "Ambience", end: 50 }, { label: "Door Chime", end: 55.9 } ],
      inner: [ { label: "Melody", end: 7.9 }, { label: "Door Chime", end: 11.4 }, { label: "Ambience", end: 18.4 }, { label: "Announcement", end: 45.6 }, { label: "Ambience", end: 52 }, { label: "Door Chime", end: 62 } ]
    }
  },
  { jy: "09", name: "Tabata",           kanji: "田端",   artwork: "artwork/JY09.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY09-Tabata-Inner.opus",           outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY09-Tabata-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 11.7 }, { label: "Door Chime", end: 15.7 }, { label: "Ambience", end: 26 }, { label: "Announcement", end: 71.6 }, { label: "Ambience", end: 76.4 }, { label: "Door Chime", end: 82.7 } ],
      inner: [ { label: "Melody", end: 7.9 }, { label: "Door Chime", end: 11.4 }, { label: "Ambience", end: 20.7 }, { label: "Announcement", end: 46.4 }, { label: "Ambience", end: 52 }, { label: "Door Chime", end: 59.1 } ]
    }
  },
  { jy: "10", name: "Komagome",         kanji: "駒込",   artwork: "artwork/JY10.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY10-Komagome-Inner.opus",         outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY10-Komagome-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 17.6 }, { label: "Door Chime", end: 21.1 }, { label: "Ambience", end: 34.2 }, { label: "Announcement", end: 55 }, { label: "Ambience", end: 62 }, { label: "Door Chime", end: 69 } ],
      inner: [ { label: "Melody", end: 17.6 }, { label: "Door Chime", end: 21.3 }, { label: "Ambience", end: 30.6 }, { label: "Announcement", end: 52 }, { label: "Ambience", end: 62.3 }, { label: "Door Chime", end: 71.3 } ]
    }
  },
  { jy: "11", name: "Sugamo",           kanji: "巣鴨",   artwork: "artwork/JY11.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY11-Sugamo-Inner.opus",           outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY11-Sugamo-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 11.7 }, { label: "Door Chime", end: 15.2 }, { label: "Ambience", end: 27.1 }, { label: "Announcement", end: 49 }, { label: "Ambience", end: 56.2 }, { label: "Door Chime", end: 62.7 } ],
      inner: [ { label: "Melody", end: 11 }, { label: "Door Chime", end: 14.5 }, { label: "Ambience", end: 23 }, { label: "Announcement", end: 68 }, { label: "Ambience", end: 72 }, { label: "Door Chime", end: 82 } ]
    }
  },
  { jy: "12", name: "Ōtsuka",           kanji: "大塚",   artwork: "artwork/JY12.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY12-Otsuka-Inner.opus",           outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY12-Otsuka-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 11.9 }, { label: "Door Chime", end: 15.6 }, { label: "Ambience", end: 26.5 }, { label: "Announcement", end: 70.3 }, { label: "Ambience", end: 74 }, { label: "Door Chime", end: 80.9 } ],
      inner: [ { label: "Melody", end: 11.4 }, { label: "Door Chime", end: 14.9 }, { label: "Ambience", end: 25 }, { label: "Announcement", end: 46.2 }, { label: "Ambience", end: 55.5 }, { label: "Door Chime", end: 64.3 } ]
    }
  },
  { jy: "13", name: "Ikebukuro",        kanji: "池袋",   artwork: "artwork/JY13.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY13-Ikebukuro-Inner.opus",        outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY13-Ikebukuro-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 14 }, { label: "Door Chime", end: 17.3 }, { label: "Ambience", end: 29.7 }, { label: "Announcement", end: 42.8 }, { label: "Ambience", end: 49.7 }, { label: "Door Chime", end: 56 } ],
      inner: [ { label: "Melody", end: 12.7 }, { label: "Door Chime", end: 16.2 }, { label: "Ambience", end: 25 }, { label: "Announcement", end: 46.6 }, { label: "Ambience", end: 57 }, { label: "Door Chime", end: 66.4 } ]
    }
  },
  { jy: "14", name: "Mejiro",           kanji: "目白",   artwork: "artwork/JY14.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY14-Mejiro-Inner.opus",           outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY14-Mejiro-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 11.6 }, { label: "Door Chime", end: 15 }, { label: "Ambience", end: 24 }, { label: "Announcement", end: 50 }, { label: "Ambience", end: 59 }, { label: "Door Chime", end: 67 } ],
      inner: [ { label: "Melody", end: 10.9 }, { label: "Door Chime", end: 14.4 }, { label: "Ambience", end: 24 }, { label: "Announcement", end: 67.3 }, { label: "Ambience", end: 72.8 }, { label: "Door Chime", end: 81.4 } ]
    }
  },
  { jy: "15", name: "Takadanobaba",     kanji: "高田馬場", artwork: "artwork/JY15.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY15-Takadanobaba-Inner.opus",     outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY15-Takadanobaba-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 17 }, { label: "Door Chime", end: 21 }, { label: "Ambience", end: 29.8 }, { label: "Announcement", end: 71 }, { label: "Ambience", end: 73.7 }, { label: "Door Chime", end: 81.5 }, { label: "Station Announcement", end: 95.9 } ],
      inner: [ { label: "Melody", end: 15.6 }, { label: "Door Chime", end: 19 }, { label: "Ambience", end: 26.6 }, { label: "Announcement", end: 39.3 }, { label: "Ambience", end: 52 }, { label: "Door Chime", end: 59.6 } ]
    }
  },
  { jy: "16", name: "Shin-Ōkubo",       kanji: "新大久保", artwork: "artwork/JY16.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY16-Shin-Okubo-Inner.opus",       outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY16-Shin-Okubo-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 9.3 }, { label: "Door Chime", end: 13 }, { label: "Ambience", end: 20 }, { label: "Announcement", end: 65.4 }, { label: "Ambience", end: 72.4 }, { label: "Door Chime", end: 78.3 } ],
      inner: [ { label: "Melody", end: 7.8 }, { label: "Door Chime", end: 11.4 }, { label: "Ambience", end: 19 }, { label: "Announcement", end: 45 }, { label: "Ambience", end: 57 }, { label: "Door Chime", end: 65.5 } ]
    }
  },
  { jy: "17", name: "Shinjuku",         kanji: "新宿",   artwork: "artwork/JY17.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY17-Shinjuku-Inner.opus",         outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY17-Shinjuku-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 8.2 }, { label: "Door Chime", end: 11.7 }, { label: "Ambience", end: 24.9 }, { label: "Announcement", end: 46.3 }, { label: "Ambience", end: 54.6 }, { label: "Door Chime", end: 61.2 } ],
      inner: [ { label: "Melody", end: 7.6 }, { label: "Door Chime", end: 11 }, { label: "Ambience", end: 20 }, { label: "Announcement", end: 61 }, { label: "Ambience", end: 64.8 }, { label: "Door Chime", end: 73.9 } ]
    }
  },
  { jy: "18", name: "Yoyogi",           kanji: "代々木", artwork: "artwork/JY18.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY18-Yoyogi-Inner.opus",           outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY18-Yoyogi-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 9.3 }, { label: "Door Chime", end: 12.9 }, { label: "Ambience", end: 26 }, { label: "Announcement", end: 47.3 }, { label: "Ambience", end: 55.7 }, { label: "Door Chime", end: 62.7 } ],
      inner: [ { label: "Melody", end: 7.9 }, { label: "Door Chime", end: 11.3 }, { label: "Ambience", end: 19.6 }, { label: "Announcement", end: 64.7 }, { label: "Ambience", end: 74.4 }, { label: "Door Chime", end: 81.7 } ]
    }
  },
  { jy: "19", name: "Harajuku",         kanji: "原宿",   artwork: "artwork/JY19.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY19-Harajuku-Inner.opus",         outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY19-Harajuku-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 9.8 }, { label: "Door Chime", end: 13.6 }, { label: "Ambience", end: 22.1 }, { label: "Announcement", end: 72.5 }, { label: "Ambience", end: 80 }, { label: "Door Chime", end: 86.9 } ],
      inner: [ { label: "Melody", end: 8 }, { label: "Door Chime", end: 11.6 }, { label: "Ambience", end: 24 }, { label: "Announcement", end: 45.3 }, { label: "Ambience", end: 58 }, { label: "Door Chime", end: 65.8 } ]
    }
  },
  { jy: "20", name: "Shibuya",          kanji: "渋谷",   artwork: "artwork/JY20.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY20-Shibuya-Inner.opus",          outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY20-Shibuya-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 9 }, { label: "Door Chime", end: 12.7 }, { label: "Ambience", end: 25 }, { label: "Announcement", end: 50 }, { label: "Ambience", end: 55.5 }, { label: "Door Chime", end: 62.9 } ],
      inner: [ { label: "Melody", end: 8.4 }, { label: "Door Chime", end: 12 }, { label: "Ambience", end: 22.5 }, { label: "Announcement", end: 43.7 }, { label: "Ambience", end: 56.5 }, { label: "Door Chime", end: 62.5 }, { label: "Station Announcement", end: 79.3 } ]
    }
  },
  { jy: "21", name: "Ebisu",            kanji: "恵比寿", artwork: "artwork/JY21.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY21-Ebisu-Inner.opus",            outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY21-Ebisu-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ],
      inner: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ]
    }
  },
  { jy: "22", name: "Meguro",           kanji: "目黒",   artwork: "artwork/JY22.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY22-Meguro-Inner.opus",           outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY22-Meguro-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ],
      inner: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ]
    }
  },
  { jy: "23", name: "Gotanda",          kanji: "五反田", artwork: "artwork/JY23.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY23-Gotanda-Inner.opus",          outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY23-Gotanda-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ],
      inner: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ]
    }
  },
  { jy: "24", name: "Ōsaki",            kanji: "大崎",   artwork: "artwork/JY24.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY24-Osaki-Inner.opus",            outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY24-Osaki-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ],
      inner: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ]
    }
  },
  { jy: "25", name: "Shinagawa",        kanji: "品川",   artwork: "artwork/JY25.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY25-Shinagawa-Inner.opus",        outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY25-Shinagawa-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ],
      inner: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ]
    }
  },
  { jy: "26", name: "Takanawa Gateway", kanji: "高輪ゲートウェイ", artwork: "artwork/JY26.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY26-Takanawa-Gateway-Inner.opus", outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY26-Takanawa-Gateway-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ],
      inner: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ]
    }
  },
  { jy: "27", name: "Tamachi",          kanji: "田町",   artwork: "artwork/JY27.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY27-Tamachi-Inner.opus",          outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY27-Tamachi-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ],
      inner: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ]
    }
  },
  { jy: "28", name: "Hamamatsuchō",     kanji: "浜松町", artwork: "artwork/JY28.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY28-Hamamatsucho-Inner.opus",     outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY28-Hamamatsucho-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ],
      inner: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ]
    }
  },
  { jy: "29", name: "Shimbashi",        kanji: "新橋",   artwork: "artwork/JY29.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY29-Shimbashi-Inner.opus",        outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY29-Shimbashi-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ],
      inner: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ]
    }
  },
  { jy: "30", name: "Yūrakuchō",        kanji: "有楽町", artwork: "artwork/JY30.png",
    audio: { inner: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY30-Yurakucho-Inner.opus",        outer: "https://yamanote-audio-8beb.pacifierpacifies.workers.dev/JY30-Yurakucho-Outer.opus" },
    sections: {
      outer: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ],
      inner: [ { label: "Melody", end: 0 }, { label: "Door Chime", end: 0 }, { label: "Ambience", end: 0 }, { label: "Announcement", end: 0 }, { label: "Ambience", end: 0 }, { label: "Door Chime", end: 0 } ]
    }
  },
];

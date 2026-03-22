export interface Sample {
  input: string;
  sei: string;
  mei: string;
}

export interface SampleCategory {
  id: string;
  label: string;
  description: string;
  samples: Sample[];
}

export const sampleCategories: SampleCategory[] = [
  {
    id: "general",
    label: "一般",
    description: "一般的な日本人名",
    samples: [
      { input: "田中太郎", sei: "田中", mei: "太郎" },
      { input: "佐藤花子", sei: "佐藤", mei: "花子" },
      { input: "鈴木一郎", sei: "鈴木", mei: "一郎" },
      { input: "高橋健太", sei: "高橋", mei: "健太" },
      { input: "渡辺美咲", sei: "渡辺", mei: "美咲" },
      { input: "伊藤翔", sei: "伊藤", mei: "翔" },
      { input: "山本直樹", sei: "山本", mei: "直樹" },
      { input: "中村優子", sei: "中村", mei: "優子" },
      { input: "小林大輔", sei: "小林", mei: "大輔" },
      { input: "加藤真由美", sei: "加藤", mei: "真由美" },
    ],
  },
  {
    id: "vtuber",
    label: "VTuber",
    description: "VTuber の名前（漢字＋カタカナ/ひらがな混合）",
    samples: [
      { input: "宝鐘マリン", sei: "宝鐘", mei: "マリン" },
      { input: "星街すいせい", sei: "星街", mei: "すいせい" },
      { input: "猫又おかゆ", sei: "猫又", mei: "おかゆ" },
      { input: "戌神ころね", sei: "戌神", mei: "ころね" },
      { input: "夏色まつり", sei: "夏色", mei: "まつり" },
      { input: "白銀ノエル", sei: "白銀", mei: "ノエル" },
      { input: "角巻わため", sei: "角巻", mei: "わため" },
      { input: "天音かなた", sei: "天音", mei: "かなた" },
      { input: "常闇トワ", sei: "常闇", mei: "トワ" },
      { input: "姫森ルーナ", sei: "姫森", mei: "ルーナ" },
    ],
  },
  {
    id: "kanji-hiragana",
    label: "漢字+ひらがな",
    description: "姓が漢字、名がひらがなの名前",
    samples: [
      { input: "綾瀬はるか", sei: "綾瀬", mei: "はるか" },
      { input: "安めぐみ", sei: "安", mei: "めぐみ" },
      { input: "井上あさひ", sei: "井上", mei: "あさひ" },
      { input: "大竹しのぶ", sei: "大竹", mei: "しのぶ" },
      { input: "田中れいな", sei: "田中", mei: "れいな" },
    ],
  },
  {
    id: "kanji-katakana",
    label: "漢字+カタカナ",
    description: "姓が漢字、名がカタカナの名前",
    samples: [
      { input: "宇多田ヒカル", sei: "宇多田", mei: "ヒカル" },
      { input: "西野カナ", sei: "西野", mei: "カナ" },
      { input: "木村カエラ", sei: "木村", mei: "カエラ" },
      { input: "土屋アンナ", sei: "土屋", mei: "アンナ" },
      { input: "加藤ミリヤ", sei: "加藤", mei: "ミリヤ" },
    ],
  },
  {
    id: "kana-kanji",
    label: "かな+漢字",
    description: "姓がかな、名が漢字の名前",
    samples: [
      { input: "かたせ梨乃", sei: "かたせ", mei: "梨乃" },
      { input: "あき竹城", sei: "あき", mei: "竹城" },
      { input: "いしだ壱成", sei: "いしだ", mei: "壱成" },
      { input: "つるの剛士", sei: "つるの", mei: "剛士" },
      { input: "グッチ裕三", sei: "グッチ", mei: "裕三" },
    ],
  },
  {
    id: "single-char-sei",
    label: "1文字姓",
    description: "姓が1文字の名前",
    samples: [
      { input: "林修", sei: "林", mei: "修" },
      { input: "森鷗外", sei: "森", mei: "鷗外" },
      { input: "堺雅人", sei: "堺", mei: "雅人" },
      { input: "原由子", sei: "原", mei: "由子" },
      { input: "辻希美", sei: "辻", mei: "希美" },
    ],
  },
  {
    id: "long-sei",
    label: "3文字以上姓",
    description: "姓が3文字以上の名前",
    samples: [
      { input: "勅使河原宏", sei: "勅使河原", mei: "宏" },
      { input: "長谷川博己", sei: "長谷川", mei: "博己" },
      { input: "五十嵐隼士", sei: "五十嵐", mei: "隼士" },
      { input: "小比類巻かほる", sei: "小比類巻", mei: "かほる" },
      { input: "二階堂ふみ", sei: "二階堂", mei: "ふみ" },
    ],
  },
  {
    id: "variant-kanji",
    label: "異体字",
    description: "旧字体・異体字を含む名前",
    samples: [
      { input: "齋藤飛鳥", sei: "齋藤", mei: "飛鳥" },
      { input: "齊藤京子", sei: "齊藤", mei: "京子" },
      { input: "髙橋大輔", sei: "髙橋", mei: "大輔" },
      { input: "渡邊圭祐", sei: "渡邊", mei: "圭祐" },
      { input: "濵田崇裕", sei: "濵田", mei: "崇裕" },
    ],
  },
];

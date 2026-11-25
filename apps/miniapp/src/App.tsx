import { useState, useEffect } from "react";
import {
  HeartPulse,
  UserRound,
  UsersRound,
  TrendingUp,
  Pill,
  Syringe,
  BookOpen,
  Thermometer,
  Activity,
  Weight,
  ClipboardList,
  Plus,
  ChevronRight,
  Bell,
  X,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import "./App.css";
import { supabase } from "./lib/supabase";

type Mode = "parents" | "pregnancy" | "doctors";
type Tab = "Профіль" | "Здоров’я" | "Ліки" | "Щеплення" | "Довідник";
type Action = "Температура" | "Тиск" | "Симптом" | "Вага";
type FamilyProfile = {
  id: string;
  name: string;
  gender: "Дівчинка" | "Хлопчик";
  birthDate?: string;
  birthYear?: number;
  currentWeight?: string;
  birthWeight?: string;
  weight?: string; // сумісність зі старими локально збереженими профілями
};
type TelegramUser = {
  telegram_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
};

const actions = [
  {
    title: "Температура" as Action,
    subtitle: "Записати показник",
    icon: Thermometer,
  },
  { title: "Тиск" as Action, subtitle: "Артеріальний тиск", icon: Activity },
  { title: "Симптом" as Action, subtitle: "Самопочуття", icon: ClipboardList },
  { title: "Вага" as Action, subtitle: "Записати вагу", icon: Weight },
];
const pregnancyWeeks = [
  {
    week: '4–5',
    fruit: 'Насінину полуниці',
    image: '/images/pregnancy/04-05-strawberry.png',
    size: '1–2 мм',
    weight: 'Менше 1 г',
    development: 'Малюк ще зовсім крихітний. Починають формуватися нервова трубка, з якої розвинуться головний і спинний мозок, та тканини майбутнього серця.',
    mother: 'Можлива затримка менструації, чутливість грудей, втома, здуття живота. Нудота може з’явитися, але її відсутність теж нормальна.',
    attention: 'Якщо вагітність підтвердилася, заплануй консультацію лікаря та обговори прийом фолієвої кислоти.'
  },
  {
    week: '6',
    fruit: 'Чорничку',
    image: '/images/pregnancy/06-blueberry.png',
    size: '4–6 мм',
    weight: 'Менше 1 г',
    development: 'Активно розвиваються головний мозок, серце, зачатки ручок і ніжок. Серцева діяльність може вже визначатися під час УЗД.',
    mother: 'Можливі нудота, сонливість, втома, чутливість грудей, частіше сечовипускання та зміни апетиту.',
    attention: 'Якщо через нудоту не вдається пити або утримувати їжу, звернися до лікаря.'
  },
  {
    week: '9',
    fruit: 'Міні-кокос',
    image: '/images/pregnancy/09-coconut.png',
    size: '2–2,3 см',
    weight: 'Близько 2 г',
    development: 'Формуються пальчики, повіки, риси обличчя. Ручки та ніжки стають виразнішими, малюк уже може рухатися, хоча мама цього ще не відчуває.',
    mother: 'Нудота, зміни смаку та запахів, втома, здуття, часте сечовипускання. Емоційний стан може змінюватися.',
    attention: 'Не всі симптоми проявляються одночасно. Відсутність нудоти сама по собі не свідчить про проблему.'
  },
  {
    week: '12',
    fruit: 'Персик',
    image: '/images/pregnancy/12-peach.png',
    size: '5,4–6 см',
    weight: '14–15 г',
    development: 'Основні органи вже сформовані та продовжують дозрівати. Малюк рухає ручками й ніжками, формуються нігті.',
    mother: 'У багатьох жінок нудота поступово слабшає. Може з’явитися більше енергії, але втома та чутливість грудей можуть зберігатися.',
    attention: 'Обговори з лікарем обстеження першого триместру та терміни скринінгу.'
  },
  {
    week: '16',
    fruit: 'Авокадо',
    image: '/images/pregnancy/16-avocado.png',
    size: 'Близько 12 см',
    weight: '100–140 г',
    development: 'Кістки міцнішають, рухи кінцівок стають координованішими. Малюк може смоктати пальчик, а на тілі з’являється тоненьке волоссячко.',
    mother: 'Животик може ставати помітнішим. Часто повертається енергія, але можливі закрепи, закладеність носа та тягнучі відчуття з боків живота.',
    attention: 'Перші рухи можна відчути приблизно в цей період, але часто вони стають помітними пізніше.'
  },
  {
    week: '20',
    fruit: 'Банан',
    image: '/images/pregnancy/20-banana.png',
    size: 'Близько 25–26 см',
    weight: 'Близько 300 г',
    development: 'Малюк реагує на звуки, розвиваються органи чуття, ростуть брови та вії. Рухи стають активнішими.',
    mother: 'Можуть з’явитися перші відчутні рухи — наче бульбашки або легкі поштовхи. Також можливі біль у спині, печія та швидша втомлюваність.',
    attention: 'Зазвичай у цей період проводять анатомічне УЗД другого триместру. Узгодь його термін із лікарем.'
  },
  {
    week: '24',
    fruit: 'Кукурудзину',
    image: '/images/pregnancy/24-corn.png',
    size: 'Близько 30–33 см',
    weight: '600–670 г',
    development: 'Легені продовжують розвиватися. Малюк чує звуки, рухається, може торкатися обличчя та смоктати пальчик.',
    mother: 'Можливі біль у спині, печія, судоми ніг, закрепи, набряклість та проблеми зі сном.',
    attention: 'Звертай увагу на звичний характер рухів малюка. Якщо рухи помітно зменшилися — звернися по медичну допомогу негайно.'
  },
  {
    week: '28',
    fruit: 'Баклажан',
    image: '/images/pregnancy/28-eggplant.png',
    size: 'Близько 37–38 см',
    weight: '1 000–1 200 г',
    development: 'Очі можуть відкриватися та заплющуватися. Дозріває нервова система, накопичується підшкірний жир, легені продовжують формуватися.',
    mother: 'Можливі печія, біль у спині, важкість у ногах, частіше сечовипускання та труднощі зі сном. Іноді відчувається напруження живота.',
    attention: 'Обговори з лікарем план спостереження в третьому триместрі та рекомендовані щеплення.'
  },
  {
    week: '32',
    fruit: 'Ананас',
    image: '/images/pregnancy/32-pineapple.png',
    size: 'Близько 42–43 см',
    weight: '1 700–1 950 г',
    development: 'Малюк активно набирає вагу, накопичує жир. Легені та мозок продовжують дозрівати, рухи можуть відчуватися сильніше.',
    mother: 'Можливі задишка під час навантаження, печія, біль у спині, набряклість ніг та частіші позиви до сечовипускання.',
    attention: 'Сильний або раптовий набряк обличчя чи рук, сильний головний біль або порушення зору потребують термінової медичної оцінки.'
  },
  {
    week: '36',
    fruit: 'Диню',
    image: '/images/pregnancy/36-melon.png',
    size: 'Близько 47–48 см',
    weight: '2 600–2 800 г',
    development: 'Малюк стає округлішим, накопичує підшкірний жир. Кістки міцнішають, а голівка залишається достатньо гнучкою для пологів.',
    mother: 'Можливі тиск унизу живота, часте сечовипускання, біль у тазу, втома та складнощі зі сном.',
    attention: 'Обговори з лікарем положення малюка та план пологів. При підтіканні вод або кровотечі звертайся негайно.'
  },
  {
    week: '40',
    fruit: 'Гарбуз',
    image: '/images/pregnancy/40-pumpkin.png',
    size: 'Близько 51 см',
    weight: '3 400–3 600 г',
    development: 'Малюк досяг орієнтовного терміну пологів. Мозок, легені та нервова система продовжують завершувати дозрівання.',
    mother: 'Можливі нерегулярні тренувальні скорочення, тиск унизу живота, біль у спині, втома та порушення сну.',
    attention: 'Регулярні перейми, відходження вод, кровотеча або зменшення рухів малюка — привід негайно зв’язатися з пологовим відділенням.'
  }
]
function App() {
  console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log("Supabase client:", supabase ? "Підключений" : "Не підключений");

  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [authStatus, setAuthStatus] = useState("Перевірка Telegram...");
  const [authError, setAuthError] = useState("");
  const [mode, setMode] = useState<Mode>("parents");
  const [selectedPregnancyWeek, setSelectedPregnancyWeek] = useState('12')

const currentPregnancyWeek = pregnancyWeeks.find(
  (item) => item.week === selectedPregnancyWeek
) ?? pregnancyWeeks[3]
  const [tab, setTab] = useState<Tab>("Профіль");
  const [person, setPerson] = useState("Мій профіль");
  const [modal, setModal] = useState<Action | "Додати профіль" | null>(null);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [newName, setNewName] = useState("");
  const [newGender, setNewGender] = useState<"Дівчинка" | "Хлопчик">("Дівчинка");
  const [newBirthDate, setNewBirthDate] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [family, setFamily] = useState<FamilyProfile[]>([]);
  const [familyLoaded, setFamilyLoaded] = useState(false);
  const [showBirthCelebration, setShowBirthCelebration] = useState(false);
  const [records, setRecords] = useState<
    {
      person: string;
      type: Action;
      value: string;
      note: string;
      date: string;
    }[]
  >([]);
  const personRecords = records.filter((record) => record.person === person);

  useEffect(() => {
    let cancelled = false;

    const authenticateTelegram = async () => {
      try {
        const telegram = (window as any).Telegram?.WebApp;

        if (!telegram) {
          throw new Error("Telegram WebApp API не знайдено");
        }

        telegram.ready();
        telegram.expand();

        const initData = telegram.initData;

        if (!initData) {
          setAuthStatus("Відкрийте застосунок через Telegram");
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-auth`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ initData }),
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Помилка авторизації");
        }

        if (!cancelled) {
          setTelegramUser(result.user);

          // Завантажуємо профілі з приватного сховища Supabase.
          const familyResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/family-profiles`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({ initData, action: "list" }),
            },
          );

          const familyResult = await familyResponse.json();
          if (!familyResponse.ok) {
            throw new Error(familyResult.error || "Не вдалося завантажити профілі родини");
          }

          let cloudProfiles = Array.isArray(familyResult.profiles)
            ? familyResult.profiles
            : [];

          // Одноразово переносимо старі локальні профілі в хмару, якщо хмара ще порожня.
          const storageKey = `meddotyk:family:${result.user.telegram_id}`;
          if (cloudProfiles.length === 0) {
            try {
              const savedFamily = localStorage.getItem(storageKey);
              const parsed = savedFamily ? JSON.parse(savedFamily) : [];
              if (Array.isArray(parsed) && parsed.length > 0) {
                cloudProfiles = parsed;
                const migrationResponse = await fetch(
                  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/family-profiles`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                    },
                    body: JSON.stringify({
                      initData,
                      action: "sync",
                      profiles: parsed,
                    }),
                  },
                );
                if (!migrationResponse.ok) {
                  console.error("Не вдалося перенести локальні профілі до Supabase");
                }
              }
            } catch (storageError) {
              console.error("Не вдалося прочитати старі локальні профілі:", storageError);
            }
          }

          if (!cancelled) {
            setFamily(cloudProfiles);
            setFamilyLoaded(true);
            setAuthStatus("Telegram підтверджено");
            setAuthError("");
          }
        }
      } catch (error) {
        console.error("Telegram auth error:", error);

        if (!cancelled) {
          setAuthStatus("Не вдалося авторизуватися");
          setAuthError(
            error instanceof Error ? error.message : "Невідома помилка",
          );
        }
      }
    };

    authenticateTelegram();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!telegramUser?.telegram_id || !familyLoaded) return;

    // Локальна копія — для швидкого відкриття та резерву на цьому пристрої.
    try {
      localStorage.setItem(
        `meddotyk:family:${telegramUser.telegram_id}`,
        JSON.stringify(family),
      );
    } catch (storageError) {
      console.error("Не вдалося зберегти локальну копію профілів:", storageError);
    }

    // Основне сховище — Supabase. Сервер сам визначає власника за Telegram initData.
    const telegramInitData = (window as any).Telegram?.WebApp?.initData;
    if (!telegramInitData) return;

    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/family-profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        initData: telegramInitData,
        action: "sync",
        profiles: family,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.error || "Помилка синхронізації профілів");
        }
      })
      .catch((error) => {
        console.error("Не вдалося синхронізувати профілі з Supabase:", error);
      });
  }, [family, telegramUser, familyLoaded]);

  const saveRecord = () => {
    if (!value.trim() || !actions.some((a) => a.title === modal)) return;
    setRecords([
      {
        person,
        type: modal as Action,
        value: value.trim(),
        note,
        date: new Date().toLocaleString("uk-UA"),
      },
      ...records,
    ]);
    setValue("");
    setNote("");
    setModal(null);
  };

  const deleteChildProfile = async (child: FamilyProfile) => {
    const confirmed = window.confirm(
      `Видалити профіль дитини «${child.name}»? Цю дію не можна буде скасувати.`,
    );
    if (!confirmed) return;

    const initData = (window as any).Telegram?.WebApp?.initData;
    if (!initData) {
      alert("Відкрийте MedDotyk через Telegram, щоб видалити профіль із хмарного сховища.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/family-profiles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ initData, action: "delete", profileId: child.id }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Не вдалося видалити профіль");

      setFamily((current) => current.filter((item) => item.id !== child.id));
      if (person === child.name) setPerson("Мій профіль");
    } catch (error) {
      console.error("Помилка видалення профілю дитини:", error);
      alert(error instanceof Error ? error.message : "Не вдалося видалити профіль. Спробуйте ще раз.");
    }
  };

  const createChildProfile = (source: "parents" | "pregnancy" = "parents") => {
    const normalizedWeight = newWeight.replace(",", ".").trim();
    const parsedWeight = Number(normalizedWeight);
    const today = new Date().toISOString().slice(0, 10);

    if (!newName.trim() || !normalizedWeight || !Number.isFinite(parsedWeight)) return;

    if (source === "parents") {
      if (
        !newBirthDate ||
        newBirthDate > today ||
        parsedWeight < 0.1 ||
        parsedWeight > 200
      ) return;
    } else {
      if (
        !newBirthDate ||
        newBirthDate > today ||
        parsedWeight < 0.3 ||
        parsedWeight > 10
      ) return;
    }

    const child: FamilyProfile = source === "parents"
      ? {
          id: crypto.randomUUID(),
          name: newName.trim(),
          gender: newGender,
          birthDate: newBirthDate,
          currentWeight: normalizedWeight,
        }
      : {
          id: crypto.randomUUID(),
          name: newName.trim(),
          gender: newGender,
          birthDate: newBirthDate,
          birthWeight: normalizedWeight,
        };

    setFamily((current) => [...current, child]);
    setPerson(child.name);
    setNewName("");
    setNewBirthDate("");
    setNewWeight("");
    setNewGender("Дівчинка");
    setModal(null);

    if (source === "pregnancy") {
      setShowBirthCelebration(true);
      setMode("parents");
      setTab("Профіль");
    }
  };

  const nav: { label: Tab; icon: typeof UserRound }[] = [
    { label: "Профіль", icon: UserRound },
    { label: "Здоров’я", icon: TrendingUp },
    { label: "Ліки", icon: Pill },
    { label: "Щеплення", icon: Syringe },
    { label: "Довідник", icon: BookOpen },
  ];

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">
          <HeartPulse size={25} />
        </div>
        <div className="brand-copy">
          <strong>Мій сімейний лікар</strong>
          <span>Медичний простір вашої родини</span>
        </div>
        <button className="icon-button" aria-label="Сповіщення">
          <Bell size={19} />
        </button>
      </header>

      <nav className="mode-switch">
        <button
          className={mode === "parents" ? "active parents" : ""}
          onClick={() => setMode("parents")}
        >
          <UsersRound size={16} />
          Для батьків
        </button>

        <button
          className={mode === "pregnancy" ? "active pregnancy" : ""}
          onClick={() => setMode("pregnancy")}
        >
          <HeartPulse size={16} />
          Для вагітних
        </button>

        <button
          className={mode === "doctors" ? "active doctors" : ""}
          onClick={() => setMode("doctors")}
        >
          <Activity size={16} />
          Для лікарів
        </button>
      </nav>
      {mode === "parents" && (
        <>
          <section className="profile-banner">
            <div className="profile-avatar">
              {telegramUser?.photo_url ? (
                <img
                  src={telegramUser.photo_url}
                  alt="Фото профілю"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "12px",
                    display: "block",
                  }}
                />
              ) : (
                <UserRound size={25} />
              )}
            </div>

            <div className="profile-info">
              <strong>
                {telegramUser
                  ? [telegramUser.first_name, telegramUser.last_name]
                      .filter(Boolean)
                      .join(" ")
                  : "Особистий профіль"}
              </strong>

              <span>
                {telegramUser?.username
                  ? `@${telegramUser.username}`
                  : "Ваш обліковий запис Telegram"}
              </span>

              <small>
                <ShieldCheck size={13} />
                {authStatus}
              </small>

              {authError && <small>{authError}</small>}
            </div>

            <ChevronRight size={20} />
          </section>

          <section className="section">
            <div className="section-head">
              <div>
                <h2>Мої діти</h2>
                <p>Додавайте окремі профілі дітей</p>
              </div>
              <button
                className="text-button"
                onClick={() => setModal("Додати профіль")}
              >
                <Plus size={15} /> Додати
              </button>
            </div>
            <div className="family-row">
              <button
                onClick={() => setPerson("Мій профіль")}
                className={`family-card owner-card ${person === "Мій профіль" ? "chosen" : ""}`}
              >
                <span className="child-avatar owner-avatar">
                  <UserRound size={18} />
                </span>
                <strong>Мій профіль</strong>
                <small>Власник акаунта</small>
                {person === "Мій профіль" && <em>Обрано</em>}
              </button>
              {family.map((child) => (
                <div
                  key={child.id}
                  className={`family-card-wrap ${person === child.name ? "chosen" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setPerson(child.name)}
                    className={`family-card ${person === child.name ? "chosen" : ""}`}
                  >
                    <span className="child-avatar">{child.gender === "Дівчинка" ? "👧" : "👦"}</span>
                    <strong>{child.name}</strong>
                    <small>
                      {child.birthDate
                        ? `${new Date(`${child.birthDate}T00:00:00`).toLocaleDateString("uk-UA")} · ${child.currentWeight ?? child.birthWeight ?? child.weight ?? "—"} кг${child.currentWeight ? " зараз" : " при народженні"}`
                        : child.birthYear
                          ? `${child.birthYear} р.н. · ${child.currentWeight ?? "—"} кг`
                          : "Профіль дитини"}
                    </small>
                    {person === child.name && <em>Обрано</em>}
                  </button>
                  <button
                    type="button"
                    className="family-card-delete"
                    aria-label={`Видалити профіль ${child.name}`}
                    title="Видалити профіль"
                    onClick={() => deleteChildProfile(child)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button
                className="add-card"
                onClick={() => setModal("Додати профіль")}
              >
                <Plus size={22} />
                <strong>Додати профіль</strong>
                <small>Дитина або член родини</small>
              </button>
            </div>
          </section>

          <div className="current-person">
            <UsersRound size={18} />
            <span>
              Зараз переглядаєте{" "}
              <strong>
                {person === "Мій профіль" ? "Особистий профіль" : person}
              </strong>
            </span>
            <small>{person === "Мій профіль" ? "Власник" : "Дитина"}</small>
          </div>

          {tab === "Профіль" && (
            <>
              <section className="section">
                <div className="section-head">
                  <div>
                    <h2>Швидкі дії</h2>
                    <p>Записуйте важливі показники</p>
                  </div>
                </div>
                <div className="action-grid">
                  {actions.map(({ title, subtitle, icon: Icon }) => (
                    <button
                      className="action-card"
                      key={title}
                      onClick={() => setModal(title)}
                    >
                      <span className="action-icon">
                        <Icon size={21} />
                      </span>
                      <strong>{title}</strong>
                      <small>{subtitle}</small>
                    </button>
                  ))}
                </div>
              </section>
              <section className="panel">
                <div className="section-head">
                  <div>
                    <h2>Останні записи</h2>
                    <p>Щоденник здоров’я · {person}</p>
                  </div>
                  <button
                    className="link-button"
                    onClick={() => setTab("Здоров’я")}
                  >
                    Усі записи <ChevronRight size={14} />
                  </button>
                </div>
                {personRecords.length ? (
                  personRecords.slice(0, 3).map((r, i) => (
                    <div className="record" key={i}>
                      <i />
                      <div>
                        <strong>
                          {r.type}: {r.value}
                        </strong>
                        <small>
                          {r.date}
                          {r.note ? ` · ${r.note}` : ""}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    <ClipboardList size={27} />
                    <strong>Записів поки немає</strong>
                    <span>
                      Додайте температуру, тиск або симптом — записи з’являться
                      тут.
                    </span>
                  </div>
                )}
              </section>
              <div className="guide-banner">
                <BookOpen size={22} />
                <div>
                  <strong>Поради сімейного лікаря</strong>
                  <span>Зрозумілі матеріали про здоров’я родини</span>
                </div>
                <ChevronRight size={18} />
              </div>
            </>
          )}

          {tab === "Здоров’я" && (
            <section className="panel tab-panel">
              <h2>Щоденник здоров’я</h2>
              <p className="muted">Показники та самопочуття · {person}</p>
              <div className="metric-grid">
                {actions
                  .filter((a) => a.title !== "Симптом")
                  .map(({ title, icon: Icon }) => (
                    <div className="metric" key={title}>
                      <Icon size={19} />
                      <span>{title}</span>
                      <strong>
                        {personRecords.find((r) => r.type === title)?.value ??
                          "—"}
                      </strong>
                    </div>
                  ))}
              </div>
              <h3>Історія записів</h3>
              {personRecords.length ? (
                personRecords.map((r, i) => (
                  <div className="record" key={i}>
                    <i />
                    <div>
                      <strong>
                        {r.type}: {r.value}
                      </strong>
                      <small>
                        {r.date} {r.note}
                      </small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty">
                  <Activity size={27} />
                  <strong>Ще немає вимірювань</strong>
                  <span>
                    Додавайте записи через швидкі дії на вкладці «Профіль».
                  </span>
                </div>
              )}
            </section>
          )}

          {tab === "Ліки" && (
            <section className="panel tab-panel">
              <div className="section-head">
                <div>
                  <h2>Моя аптечка</h2>
                  <p>Список препаратів і нагадування</p>
                </div>
                <button className="text-button">
                  <Plus size={15} /> Додати
                </button>
              </div>
              <div className="empty">
                <Pill size={28} />
                <strong>Аптечка поки порожня</strong>
                <span>
                  Додайте препарати та терміни придатності. Нагадування
                  підключимо окремо.
                </span>
              </div>
              <div className="info-note">
                Дозування та схеми прийому потрібно звіряти з призначенням
                лікаря або офіційною інструкцією.
              </div>
            </section>
          )}

          {tab === "Щеплення" && (
            <section className="panel tab-panel">
              <div className="section-head">
                <div>
                  <h2>Календар щеплень</h2>
                  <p>Історія вакцинації · {person}</p>
                </div>
                <button className="text-button">
                  <Plus size={15} /> Додати
                </button>
              </div>
              <div className="empty">
                <Syringe size={28} />
                <strong>Щеплення ще не додані</strong>
                <span>
                  Можна буде внести дані з карти щеплень або завантажити
                  документ.
                </span>
              </div>
              <div className="info-note">
                Календар допомагає вести особистий облік і не замінює
                консультацію лікаря.
              </div>
            </section>
          )}

          {tab === "Довідник" && (
            <section className="panel tab-panel">
              <h2>Медичний довідник</h2>
              <p className="muted">Пам’ятки та матеріали сімейного лікаря</p>
              {[
                [
                  "Температура у дітей",
                  "Як правильно вимірювати та коли звертатися",
                ],
                ["Вакцинація", "Планові щеплення та підготовка"],
                ["Аптечка родини", "Зберігання ліків і терміни придатності"],
                ["Артеріальний тиск", "Як правильно вимірювати вдома"],
                ["Невідкладна допомога", "Коли не можна зволікати"],
              ].map(([title, desc]) => (
                <button className="guide-row" key={title}>
                  <BookOpen size={20} />
                  <span>
                    <strong>{title}</strong>
                    <small>{desc}</small>
                  </span>
                  <ChevronRight size={17} />
                </button>
              ))}
            </section>
          )}

          <nav className="bottom-nav">
            {nav.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className={tab === label ? "active" : ""}
                onClick={() => setTab(label)}
              >
                <Icon size={19} />
                <small>{label}</small>
              </button>
            ))}
          </nav>
        </>
      )}
     {mode === 'pregnancy' && (
  <section className="mode-content pregnancy-content">

    <div className="mode-hero pregnancy-hero">
      <span className="mode-hero-icon">🤰</span>
      <h1>Твоя вагітність — крок за кроком</h1>
      <p>
        Дізнавайся, як росте малюк і що відбувається
        з твоїм організмом на кожному етапі.
      </p>
    </div>

    <div className="pregnancy-week-selector">
      <h2>Календар розвитку малюка</h2>
      <p>Обери тиждень вагітності</p>

      <div className="pregnancy-week-list">
        {pregnancyWeeks.map((item) => (
          <button
            key={item.week}
            className={
              selectedPregnancyWeek === item.week ? 'selected' : ''
            }
            onClick={() => setSelectedPregnancyWeek(item.week)}
          >
            {item.week}
          </button>
        ))}
      </div>
    </div>

    {currentPregnancyWeek && (
      <div className="pregnancy-detail-card">

        <div className="pregnancy-detail-header">
          <span>ТИЖДЕНЬ {currentPregnancyWeek.week}</span>
          <span>РОЗВИТОК МАЛЮКА</span>
        </div>

        <div className="pregnancy-fruit-image">
          <img
            src={currentPregnancyWeek.image}
            alt={currentPregnancyWeek.fruit}
          />
        </div>

        <h2>Малюк завбільшки з {currentPregnancyWeek.fruit.toLowerCase()}</h2>

        <div className="pregnancy-stats">
          <div>
            <span>Довжина</span>
            <strong>{currentPregnancyWeek.size}</strong>
          </div>
          <div>
            <span>Орієнтовна вага</span>
            <strong>{currentPregnancyWeek.weight}</strong>
          </div>
        </div>

        <div className="pregnancy-info-block">
          <span>👶 РОЗВИТОК МАЛЮКА</span>
          <p>{currentPregnancyWeek.development}</p>
        </div>

        <div className="pregnancy-info-block mother-block">
          <span>💗 ЩО ТИ МОЖЕШ ВІДЧУВАТИ</span>
          <p>{currentPregnancyWeek.mother}</p>
        </div>

        <div className="pregnancy-info-block attention-block">
          <span>🩺 НА ЩО ЗВЕРНУТИ УВАГУ</span>
          <p>{currentPregnancyWeek.attention}</p>
        </div>

        <p className="pregnancy-disclaimer">
          Кожна вагітність індивідуальна. Описані відчуття можуть
          відрізнятися або бути відсутніми. Інформація не замінює
          консультацію лікаря.
        </p>

      </div>
    )}

    <div className="pregnancy-birth-form">
      <div className="pregnancy-birth-heading">
        <span>🎀</span>
        <div>
          <h2>Ми народились!</h2>
          <p>Після народження заповни дані малюка — створимо його профіль у розділі «Мої діти».</p>
        </div>
      </div>

      <label>Ім’я малюка</label>
      <input
        className="field"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Наприклад, Софійка"
        maxLength={60}
      />

      <label>Стать</label>
      <div className="gender-options">
        <button type="button" className={newGender === "Дівчинка" ? "selected" : ""} onClick={() => setNewGender("Дівчинка")}>👧 Дівчинка</button>
        <button type="button" className={newGender === "Хлопчик" ? "selected" : ""} onClick={() => setNewGender("Хлопчик")}>👦 Хлопчик</button>
      </div>

      <div className="birth-fields-row">
        <div>
          <label>Дата народження</label>
          <input className="field" type="date" value={newBirthDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setNewBirthDate(e.target.value)} />
        </div>
        <div>
          <label>Вага, кг</label>
          <input className="field" type="number" min="0.3" max="10" step="0.01" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="3,4" />
        </div>
      </div>

      <button
        className="primary pregnancy-birth-submit"
        disabled={
          !newName.trim() ||
          !newBirthDate ||
          newBirthDate > new Date().toISOString().slice(0, 10) ||
          !newWeight ||
          Number(newWeight.replace(",", ".")) < 0.3 ||
          Number(newWeight.replace(",", ".")) > 10
        }
        onClick={() => createChildProfile("pregnancy")}
      >
        Ми народились
      </button>
      <p className="pregnancy-form-note">Після збереження профіль з’явиться в «Мої діти» та буде збережений на цьому пристрої для цього Telegram-акаунта.</p>
    </div>

  </section>
)}
{mode === 'doctors' && (
  <section className="mode-content doctors-content">

    <div className="mode-hero doctors-hero">
      <div className="doctor-avatar">
        <UserRound size={25} />
      </div>

      <h1>Ординаторська</h1>
      <p>
        Калькулятори доз, клінічні рекомендації
        та протоколи під рукою.
      </p>

      <button className="mode-primary">
        Написати начмеду
      </button>
    </div>

    <div className="mode-card">
      <h2>Клінічні калькулятори доз та розрахунків</h2>

      <div className="doctor-feature">
        <span>⚖️</span>
        <div>
          <strong>Вага дитини</strong>
          <small>Введення ваги для розрахунків</small>
        </div>
      </div>

      <div className="doctor-feature">
        <span>💊</span>
        <div>
          <strong>Пероральні антибіотики</strong>
          <small>Розрахунок дозування за вагою</small>
        </div>
      </div>

      <div className="doctor-feature">
        <span>🌡️</span>
        <div>
          <strong>Жарознижувальні</strong>
          <small>Розрахунок рекомендованої дози</small>
        </div>
      </div>

      <div className="doctor-feature">
        <span>🩸</span>
        <div>
          <strong>Препарати заліза</strong>
          <small>Розрахунок добової дози</small>
        </div>
      </div>

      <div className="doctor-feature">
        <span>📚</span>
        <div>
          <strong>Клінічні протоколи</strong>
          <small>Довідкові матеріали та рекомендації</small>
        </div>
      </div>
    </div>

  </section>
)}

      {modal && (
        <div className="backdrop" onClick={() => setModal(null)}>
          <section className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <small>
                  {modal === "Додати профіль"
                    ? "ПРОФІЛІ РОДИНИ"
                    : "ЩОДЕННИК ЗДОРОВ’Я"}
                </small>
                <h2>
                  {modal === "Додати профіль"
                    ? "Додати профіль"
                    : `Запис: ${modal}`}
                </h2>
                <p>
                  {modal === "Додати профіль"
                    ? "Додайте дитину або члена родини"
                    : `Профіль: ${person}`}
                </p>
              </div>
              <button className="close" onClick={() => setModal(null)}>
                <X size={19} />
              </button>
            </div>
            {modal === "Додати профіль" ? (
              <div className="child-profile-form">
                <div className="child-profile-welcome">
                  <span>👶</span>
                  <strong>Створення профілю дитини</strong>
                  <p>Додайте дитину до профілю родини.</p>
                </div>

                <label>Ім’я дитини</label>
                <input
                  className="field"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Наприклад, Софійка"
                  maxLength={60}
                />

                <label>Стать</label>
                <div className="gender-options">
                  <button type="button" className={newGender === "Дівчинка" ? "selected" : ""} onClick={() => setNewGender("Дівчинка")}>👧 Дівчинка</button>
                  <button type="button" className={newGender === "Хлопчик" ? "selected" : ""} onClick={() => setNewGender("Хлопчик")}>👦 Хлопчик</button>
                </div>

                <div className="birth-fields-row">
                  <div>
                    <label>Дата народження</label>
                    <input
                      className="field"
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      value={newBirthDate}
                      onChange={(e) => setNewBirthDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Поточна вага, кг</label>
                    <input
                      className="field"
                      type="number"
                      min="0.1"
                      max="200"
                      step="0.1"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      placeholder="Наприклад, 14,5"
                    />
                  </div>
                </div>

                <div className="modal-buttons">
                  <button className="secondary" onClick={() => setModal(null)}>Скасувати</button>
                  <button
                    className="primary"
                    disabled={
                      !newName.trim() ||
                      !newBirthDate ||
                      newBirthDate > new Date().toISOString().slice(0, 10) ||
                      !newWeight ||
                      Number(newWeight.replace(",", ".")) < 0.1 ||
                      Number(newWeight.replace(",", ".")) > 200
                    }
                    onClick={() => createChildProfile("parents")}
                  >
                    Зберегти профіль
                  </button>
                </div>
                <p className="disclaimer">Профіль з’явиться в «Мої діти» та використовуватиметься в щоденнику здоров’я.</p>
              </div>
            ) : (
              <>
                <label>
                  {modal === "Температура"
                    ? "Температура, °C"
                    : modal === "Тиск"
                      ? "Тиск, мм рт. ст."
                      : modal === "Вага"
                        ? "Вага, кг"
                        : "Опишіть симптом"}
                </label>
                <input
                  className="field"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={
                    modal === "Тиск" ? "Наприклад, 120/80" : "Введіть значення"
                  }
                />
                <label>Коментар (необов’язково)</label>
                <textarea
                  className="field textarea"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Додаткові деталі"
                />
                <div className="modal-buttons">
                  <button className="secondary" onClick={() => setModal(null)}>
                    Скасувати
                  </button>
                  <button
                    className="primary"
                    disabled={!value.trim()}
                    onClick={saveRecord}
                  >
                    Зберегти
                  </button>
                </div>
                <p className="disclaimer">
                  Це особистий запис, а не медичний висновок.
                </p>
              </>
            )}
          </section>
        </div>
      )}
      {showBirthCelebration && (
        <div className="birth-celebration" role="status" aria-live="polite">
          <div className="confetti-burst" aria-hidden="true">
            {Array.from({ length: 42 }, (_, index) => (
              <i
                key={index}
                style={{
                  left: `${(index * 37) % 100}%`,
                  animationDelay: `${(index % 8) * 0.08}s`,
                  transform: `rotate(${index * 29}deg)`,
                }}
              />
            ))}
          </div>
          <div className="birth-celebration-card">
            <span>🎀</span>
            <h2>Ми народились!</h2>
            <p>Вітаємо з появою нового життя.</p>
            <button className="primary" onClick={() => setShowBirthCelebration(false)}>Продовжити</button>
          </div>
        </div>
      )}
    </main>
  );
}
export default App;

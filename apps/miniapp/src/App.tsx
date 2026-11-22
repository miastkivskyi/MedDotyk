import { useState, useEffect } from 'react'
import { HeartPulse, UserRound, UsersRound, TrendingUp, Pill, Syringe, BookOpen, Thermometer, Activity, Weight, ClipboardList, Plus, ChevronRight, Bell, X, ShieldCheck } from 'lucide-react'
import './App.css'
import { supabase } from './lib/supabase'



type Tab = 'Профіль' | 'Здоров’я' | 'Ліки' | 'Щеплення' | 'Довідник'
type Action = 'Температура' | 'Тиск' | 'Симптом' | 'Вага'
type TelegramUser = {
  telegram_id: string
  first_name: string | null
  last_name: string | null
  username: string | null
  photo_url: string | null
}

const actions = [
  { title: 'Температура' as Action, subtitle: 'Записати показник', icon: Thermometer },
  { title: 'Тиск' as Action, subtitle: 'Артеріальний тиск', icon: Activity },
  { title: 'Симптом' as Action, subtitle: 'Самопочуття', icon: ClipboardList },
  { title: 'Вага' as Action, subtitle: 'Записати вагу', icon: Weight },
]

function App() {
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
  console.log('Supabase client:', supabase ? 'Підключений' : 'Не підключений')

  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null)
  const [authStatus, setAuthStatus] = useState('Перевірка Telegram...')
  const [authError, setAuthError] = useState('')

  const [tab, setTab] = useState<Tab>('Профіль')
  const [person, setPerson] = useState('Мій профіль')
  const [modal, setModal] = useState<Action | 'Додати профіль' | null>(null)
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [newName, setNewName] = useState('')
  const [family, setFamily] = useState<string[]>([])
  const [records, setRecords] = useState<{ person: string; type: Action; value: string; note: string; date: string }[]>([])
  const personRecords = records.filter((record) => record.person === person)

  useEffect(() => {
    let cancelled = false

   const authenticateTelegram = async () => {
  try {
    const telegram = (window as any).Telegram?.WebApp

    if (!telegram) {
      throw new Error('Telegram WebApp API не знайдено')
    }

    telegram.ready()
    telegram.expand()

    const initData = telegram.initData

    if (!initData) {
      setAuthStatus('Відкрийте застосунок через Telegram')
      return
    }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-auth`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ initData }),
          }
        )

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Помилка авторизації')
        }

        if (!cancelled) {
          setTelegramUser(result.user)
          setAuthStatus('Telegram підтверджено')
          setAuthError('')
        }
      } catch (error) {
        console.error('Telegram auth error:', error)

        if (!cancelled) {
          setAuthStatus('Не вдалося авторизуватися')
          setAuthError(
            error instanceof Error ? error.message : 'Невідома помилка'
          )
        }
      }
    }

    authenticateTelegram()

    return () => {
      cancelled = true
    }
  }, [])


  const saveRecord = () => {
    if (!value.trim() || !actions.some((a) => a.title === modal)) return
    setRecords([{ person, type: modal as Action, value: value.trim(), note, date: new Date().toLocaleString('uk-UA') }, ...records])
    setValue('')
    setNote('')
    setModal(null)
  }

  const nav: { label: Tab; icon: typeof UserRound }[] = [
    { label: 'Профіль', icon: UserRound },
    { label: 'Здоров’я', icon: TrendingUp },
    { label: 'Ліки', icon: Pill },
    { label: 'Щеплення', icon: Syringe },
    { label: 'Довідник', icon: BookOpen },
  ]

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand-mark"><HeartPulse size={25}/></div>
      <div className="brand-copy"><strong>Мій сімейний лікар</strong><span>Медичний простір вашої родини</span></div>
      <button className="icon-button" aria-label="Сповіщення"><Bell size={19}/></button>
    </header>

<section className="profile-banner">
  <div className="profile-avatar">
    {telegramUser?.photo_url ? (
      <img
        src={telegramUser.photo_url}
        alt="Фото профілю"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '12px',
          display: 'block',
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
            .join(' ')
        : 'Особистий профіль'}
    </strong>

    <span>
      {telegramUser?.username
        ? `@${telegramUser.username}`
        : 'Ваш обліковий запис Telegram'}
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
      <div className="section-head"><div><h2>Мої діти</h2><p>Додавайте окремі профілі дітей</p></div><button className="text-button" onClick={() => setModal('Додати профіль')}><Plus size={15}/> Додати</button></div>
      <div className="family-row">
        <button onClick={() => setPerson('Мій профіль')} className={`family-card owner-card ${person === 'Мій профіль' ? 'chosen' : ''}`}><span className="child-avatar owner-avatar"><UserRound size={18}/></span><strong>Мій профіль</strong><small>Власник акаунта</small>{person === 'Мій профіль' && <em>Обрано</em>}</button>
        {family.map((name) => <button key={name} onClick={() => setPerson(name)} className={`family-card ${person === name ? 'chosen' : ''}`}><span className="child-avatar">{name.slice(0,1)}</span><strong>{name}</strong><small>Особистий профіль</small>{person === name && <em>Обрано</em>}</button>)}
        <button className="add-card" onClick={() => setModal('Додати профіль')}><Plus size={22}/><strong>Додати профіль</strong><small>Дитина або член родини</small></button>
      </div>
    </section>

    <div className="current-person"><UsersRound size={18}/><span>Зараз переглядаєте <strong>{person === "Мій профіль" ? "Особистий профіль" : person}</strong></span><small>{person === "Мій профіль" ? "Власник" : "Дитина"}</small></div>

    {tab === 'Профіль' && <>
      <section className="section">
        <div className="section-head"><div><h2>Швидкі дії</h2><p>Записуйте важливі показники</p></div></div>
        <div className="action-grid">{actions.map(({title, subtitle, icon: Icon}) => <button className="action-card" key={title} onClick={() => setModal(title)}><span className="action-icon"><Icon size={21}/></span><strong>{title}</strong><small>{subtitle}</small></button>)}</div>
      </section>
      <section className="panel">
        <div className="section-head"><div><h2>Останні записи</h2><p>Щоденник здоров’я · {person}</p></div><button className="link-button" onClick={() => setTab('Здоров’я')}>Усі записи <ChevronRight size={14}/></button></div>
        {personRecords.length ? personRecords.slice(0,3).map((r,i) => <div className="record" key={i}><i/><div><strong>{r.type}: {r.value}</strong><small>{r.date}{r.note ? ` · ${r.note}` : ''}</small></div></div>) : <div className="empty"><ClipboardList size={27}/><strong>Записів поки немає</strong><span>Додайте температуру, тиск або симптом — записи з’являться тут.</span></div>}
      </section>
      <div className="guide-banner"><BookOpen size={22}/><div><strong>Поради сімейного лікаря</strong><span>Зрозумілі матеріали про здоров’я родини</span></div><ChevronRight size={18}/></div>
    </>}

    {tab === 'Здоров’я' && <section className="panel tab-panel"><h2>Щоденник здоров’я</h2><p className="muted">Показники та самопочуття · {person}</p><div className="metric-grid">{actions.filter(a => a.title !== 'Симптом').map(({title,icon:Icon}) => <div className="metric" key={title}><Icon size={19}/><span>{title}</span><strong>{personRecords.find(r => r.type === title)?.value ?? '—'}</strong></div>)}</div><h3>Історія записів</h3>{personRecords.length ? personRecords.map((r,i)=><div className="record" key={i}><i/><div><strong>{r.type}: {r.value}</strong><small>{r.date} {r.note}</small></div></div>) : <div className="empty"><Activity size={27}/><strong>Ще немає вимірювань</strong><span>Додавайте записи через швидкі дії на вкладці «Профіль».</span></div>}</section>}

    {tab === 'Ліки' && <section className="panel tab-panel"><div className="section-head"><div><h2>Моя аптечка</h2><p>Список препаратів і нагадування</p></div><button className="text-button"><Plus size={15}/> Додати</button></div><div className="empty"><Pill size={28}/><strong>Аптечка поки порожня</strong><span>Додайте препарати та терміни придатності. Нагадування підключимо окремо.</span></div><div className="info-note">Дозування та схеми прийому потрібно звіряти з призначенням лікаря або офіційною інструкцією.</div></section>}

    {tab === 'Щеплення' && <section className="panel tab-panel"><div className="section-head"><div><h2>Календар щеплень</h2><p>Історія вакцинації · {person}</p></div><button className="text-button"><Plus size={15}/> Додати</button></div><div className="empty"><Syringe size={28}/><strong>Щеплення ще не додані</strong><span>Можна буде внести дані з карти щеплень або завантажити документ.</span></div><div className="info-note">Календар допомагає вести особистий облік і не замінює консультацію лікаря.</div></section>}

    {tab === 'Довідник' && <section className="panel tab-panel"><h2>Медичний довідник</h2><p className="muted">Пам’ятки та матеріали сімейного лікаря</p>{[['Температура у дітей','Як правильно вимірювати та коли звертатися'],['Вакцинація','Планові щеплення та підготовка'],['Аптечка родини','Зберігання ліків і терміни придатності'],['Артеріальний тиск','Як правильно вимірювати вдома'],['Невідкладна допомога','Коли не можна зволікати']].map(([title,desc])=><button className="guide-row" key={title}><BookOpen size={20}/><span><strong>{title}</strong><small>{desc}</small></span><ChevronRight size={17}/></button>)}</section>}

    <nav className="bottom-nav">{nav.map(({label,icon:Icon})=><button key={label} className={tab===label?'active':''} onClick={()=>setTab(label)}><Icon size={19}/><small>{label}</small></button>)}</nav>

    {modal && <div className="backdrop" onClick={()=>setModal(null)}><section className="modal" onClick={e=>e.stopPropagation()}>
      <div className="modal-head"><div><small>{modal === 'Додати профіль' ? 'ПРОФІЛІ РОДИНИ' : 'ЩОДЕННИК ЗДОРОВ’Я'}</small><h2>{modal === 'Додати профіль' ? 'Додати профіль' : `Запис: ${modal}`}</h2><p>{modal === 'Додати профіль' ? 'Додайте дитину або члена родини' : `Профіль: ${person}`}</p></div><button className="close" onClick={()=>setModal(null)}><X size={19}/></button></div>
      {modal === 'Додати профіль' ? <><label>Ім’я</label><input className="field" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Наприклад, Олена"/><div className="modal-buttons"><button className="secondary" onClick={()=>setModal(null)}>Скасувати</button><button className="primary" disabled={!newName.trim()} onClick={()=>{setFamily([...family,newName.trim()]);setPerson(newName.trim());setNewName('');setModal(null)}}>Додати</button></div></> : <><label>{modal === 'Температура' ? 'Температура, °C' : modal === 'Тиск' ? 'Тиск, мм рт. ст.' : modal === 'Вага' ? 'Вага, кг' : 'Опишіть симптом'}</label><input className="field" value={value} onChange={e=>setValue(e.target.value)} placeholder={modal === 'Тиск' ? 'Наприклад, 120/80' : 'Введіть значення'}/><label>Коментар (необов’язково)</label><textarea className="field textarea" value={note} onChange={e=>setNote(e.target.value)} placeholder="Додаткові деталі"/><div className="modal-buttons"><button className="secondary" onClick={()=>setModal(null)}>Скасувати</button><button className="primary" disabled={!value.trim()} onClick={saveRecord}>Зберегти</button></div><p className="disclaimer">Це особистий запис, а не медичний висновок.</p></>}
    </section></div>}
  </main>
}
export default App

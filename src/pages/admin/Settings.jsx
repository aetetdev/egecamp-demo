import { useState } from 'react'
import { CheckCircle2, CreditCard, Globe, Lock, Mail, Plus, Save, ShieldCheck } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { BRAND, CARGO_COMPANIES } from '../../config/brand'
import { tl } from '../../lib/format'
import { Card, PageHeader, Pill, Tabs, Toggle, useToast } from '../../components/admin/AdminUI'

function Row({ label, sub, children }) {
  return (
    <div className="flex flex-col gap-2 border-b border-line py-4 last:border-0 md:flex-row md:items-center md:justify-between md:gap-6">
      <div className="min-w-0">
        <p className="text-[14px] font-medium">{label}</p>
        {sub && <p className="text-[12.5px] text-char-500">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

const NumberField = ({ value, onChange, suffix, prefix, w = 'w-32' }) => (
  <div className={`relative ${w}`}>
    {prefix && <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-char-400">{prefix}</span>}
    <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className={`field field-sm ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-10' : ''}`} />
    {suffix && <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-char-400">{suffix}</span>}
  </div>
)

export default function Settings() {
  const { settings, setSettings } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState('magaza')
  const [notif, setNotif] = useState({ owner: true, cargo: true, daily: true, stock: true, review: false })
  const [cargo, setCargo] = useState({ 'Yurtiçi Kargo': true, 'Aras Kargo': true, 'MNG Kargo': false })
  const set = (k) => (v) => setSettings((s) => ({ ...s, [k]: v }))

  return (
    <div>
      <PageHeader
        title="Ayarlar"
        sub="Değişiklikler vitrine anında yansır"
        actions={
          <button onClick={() => toast('Ayarlar kaydedildi')} className="btn btn-primary btn-sm">
            <Save size={15} /> Kaydet
          </button>
        }
      />
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          ['magaza', 'Mağaza'],
          ['kargo', 'Kargo ve teslimat'],
          ['odeme', 'Ödeme'],
          ['bildirim', 'Bildirimler'],
          ['kullanici', 'Kullanıcılar'],
          ['alan', 'Alan adı'],
        ]}
      />

      {tab === 'magaza' && (
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Mağaza adı', BRAND.name],
              ['Telefon', BRAND.phone],
              ['WhatsApp hattı', BRAND.phone],
              ['Instagram', BRAND.instagram],
            ].map(([l, v]) => (
              <div key={l}>
                <label className="label">{l}</label>
                <input defaultValue={v} className="field field-sm" />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="label">Adres</label>
              <input defaultValue={BRAND.address} className="field field-sm" />
            </div>
            {BRAND.hours.map(([d, h]) => (
              <div key={d}>
                <label className="label">{d}</label>
                <input defaultValue={h} className="field field-sm" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'kargo' && (
        <Card>
          <Row label="Ücretsiz kargo eşiği" sub="Bu tutarın üstündeki siparişlerde kargo ücreti alınmaz">
            <NumberField value={settings.freeShippingThreshold} onChange={set('freeShippingThreshold')} suffix="TL" />
          </Row>
          <Row label="Kargo ücreti" sub="Eşiğin altındaki siparişlere uygulanır">
            <NumberField value={settings.shippingFee} onChange={set('shippingFee')} suffix="TL" />
          </Row>
          <Row label="Aynı gün kargo kesim saati" sub="Ürün sayfasındaki geri sayım ve panel uyarısı bu saate göre çalışır">
            <select value={settings.sameDayCutoff} onChange={(e) => set('sameDayCutoff')(Number(e.target.value))} className="field field-sm w-32">
              {[12, 13, 14, 15, 16, 17].map((h) => (
                <option key={h} value={h}>
                  {h}:00
                </option>
              ))}
            </select>
          </Row>
          <Row label="Mağazadan teslim al" sub="Bilecik mağazası — ücretsiz">
            <Toggle checked={settings.pickupEnabled} onChange={set('pickupEnabled')} label="Mağazadan teslim" />
          </Row>
          <Row label="Kritik stok eşiği" sub="Bu adet ve altı panelde uyarı verir">
            <NumberField value={settings.lowStockThreshold} onChange={set('lowStockThreshold')} suffix="adet" w="w-28" />
          </Row>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {CARGO_COMPANIES.map((c) => (
              <div key={c} className="rounded-xl bg-bone p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{c}</p>
                  <Toggle size="sm" checked={cargo[c]} onChange={(v) => setCargo((x) => ({ ...x, [c]: v }))} label={c} />
                </div>
                <p className="mt-1 text-[12.5px] text-char-500">{cargo[c] ? 'Anlaşmalı · etiket ve takip no API ile' : 'Kapalı'}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'odeme' && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['iyzico', true, 'Kredi kartı, taksit, 3D Secure. Para ertesi gün hesabınızda.'],
              ['PayTR', false, 'Alternatif sanal POS. İsterseniz yedek olarak bağlanır.'],
            ].map(([n, on, d]) => (
              <div key={n} className="rounded-2xl bg-white p-5 ring-1 ring-line">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 font-semibold">
                    <CreditCard size={18} className="text-char-400" /> {n}
                  </p>
                  {on ? <Pill tone="moss">Bağlı</Pill> : <Pill>Bağlı değil</Pill>}
                </div>
                <p className="mt-2 text-[13px] text-char-500">{d}</p>
                <p className="mt-3 flex items-center gap-1.5 text-[12px] text-char-400">
                  <ShieldCheck size={13} /> Sözleşme işletme adına yapılır, komisyonu ödeme kuruluşu keser.
                </p>
              </div>
            ))}
          </div>
          <Card>
            <Row label="Havale / EFT indirimi" sub="Sepette ek indirim olarak gösterilir">
              <NumberField value={settings.transferDiscountPct} onChange={set('transferDiscountPct')} prefix="%" w="w-24" />
            </Row>
            <Row label="Kapıda ödeme bedeli" sub={`Şu an ${tl(settings.codFee)}`}>
              <NumberField value={settings.codFee} onChange={set('codFee')} suffix="TL" />
            </Row>
            <Row label="En fazla taksit" sub="Tüm kartlarda">
              <select defaultValue="12" className="field field-sm w-32">
                {[3, 6, 9, 12].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </Row>
          </Card>
        </div>
      )}

      {tab === 'bildirim' && (
        <Card>
          {[
            ['owner', 'Yeni siparişte bana SMS / WhatsApp gönder', 'Telefonunuza anlık bildirim'],
            ['cargo', 'Kargoya verilince müşteriye WhatsApp gönder', 'Takip numarasıyla otomatik mesaj'],
            ['daily', 'Günlük özet e-postası', 'Her sabah 08:00 — dünün cirosu, bekleyen siparişler'],
            ['stock', 'Kritik stok uyarısı', 'Stok eşiğin altına inince'],
            ['review', 'Teslimattan 5 gün sonra değerlendirme iste', 'Yorum sayısını artırır'],
          ].map(([k, l, s]) => (
            <Row key={k} label={l} sub={s}>
              <Toggle checked={notif[k]} onChange={(v) => setNotif((n) => ({ ...n, [k]: v }))} label={l} />
            </Row>
          ))}
        </Card>
      )}

      {tab === 'kullanici' && (
        <Card
          title="Ekip"
          action={
            <button onClick={() => toast('Davet e-postası gönderildi (demo)')} className="btn btn-outline btn-sm">
              <Plus size={14} /> Kullanıcı davet et
            </button>
          }
        >
          <ul className="divide-y divide-line">
            {[
              ['Mağaza Yöneticisi', BRAND.demoEmail, 'Yönetici', 'Tüm yetkiler'],
              ['Depo Sorumlusu', 'depo@egecamp.com', 'Depo', 'Sipariş hazırlama, kargo, stok'],
              ['Mali Müşavir', 'muhasebe@egecamp.com', 'Muhasebe', 'Yalnızca rapor ve fatura görüntüleme'],
            ].map(([n, e, r, d]) => (
              <li key={e} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{n}</p>
                  <p className="text-[12.5px] text-char-400">
                    {e} · {d}
                  </p>
                </div>
                <Pill tone={r === 'Yönetici' ? 'ember' : 'neutral'}>{r}</Pill>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-char-500">
            <Lock size={13} /> Her kullanıcı yalnızca rolünün izin verdiği ekranları görür. Tüm işlemler kayıt altındadır.
          </p>
        </Card>
      )}

      {tab === 'alan' && (
        <Card>
          <div className="flex items-center gap-4 rounded-xl bg-bone p-4">
            <Globe size={22} className="text-char-400" />
            <div className="flex-1">
              <p className="font-semibold">{BRAND.domain}</p>
              <p className="text-[12.5px] text-char-500">Alan adı işletmenin kendi mülkü; site buna bağlanır.</p>
            </div>
            <Pill tone="moss">
              <CheckCircle2 size={12} /> SSL aktif
            </Pill>
          </div>
          <Row label="www yönlendirmesi" sub={`www.${BRAND.domain} → ${BRAND.domain}`}>
            <Toggle checked onChange={() => {}} label="www" />
          </Row>
          <Row label="Kurumsal e-posta" sub={`bilgi@${BRAND.domain}`}>
            <span className="flex items-center gap-1.5 text-[13px] text-char-500">
              <Mail size={14} /> Mevcut sağlayıcıda kalır
            </span>
          </Row>
        </Card>
      )}
    </div>
  )
}

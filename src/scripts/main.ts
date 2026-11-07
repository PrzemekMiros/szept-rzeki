declare global {
 interface Navigator {
  globalPrivacyControl?: boolean;
 }
 interface Window {
  dataLayer: IArguments[];
  gtag: (...args: unknown[]) => void;
 }
}

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const menu = $('.menu-toggle');
const nav = $('#main-nav');
const header = $('.site-header');
type ConsentPreferences = { analytics: boolean; marketing: boolean };
const consentStorageKey = 'szept-rzeki-consent';
const cookieBanner = $<HTMLElement>('#cookie-banner');
const cookieAnalytics = $<HTMLInputElement>('#consent-analytics');
const cookieMarketing = $<HTMLInputElement>('#consent-marketing');
const cookieError = $<HTMLElement>('#cookie-error');
const isGpcEnabled = navigator.globalPrivacyControl === true;

const readConsent = (): ConsentPreferences | null => {
 try {
  const stored = localStorage.getItem(consentStorageKey);
  if (!stored) return null;
  const parsed: unknown = JSON.parse(stored);
  if (typeof parsed !== 'object' || parsed === null) throw new Error('Stored consent is not an object');
  const preferences = parsed as Record<string, unknown>;
  if (typeof preferences.analytics !== 'boolean' || typeof preferences.marketing !== 'boolean') {
   throw new Error('Stored consent has an invalid shape');
  }
  return { analytics: preferences.analytics, marketing: preferences.marketing };
 } catch (error) {
  console.error('Unable to read saved privacy preferences.', error);
  return null;
 }
};

const applyConsent = ({ analytics, marketing }: ConsentPreferences) => {
 window.gtag('consent', 'update', {
  analytics_storage: analytics ? 'granted' : 'denied',
  ad_storage: marketing && !isGpcEnabled ? 'granted' : 'denied',
  ad_user_data: marketing && !isGpcEnabled ? 'granted' : 'denied',
  ad_personalization: marketing && !isGpcEnabled ? 'granted' : 'denied',
  personalization_storage: analytics ? 'granted' : 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
 });
};

const savedConsent = readConsent();
let effectiveConsent = isGpcEnabled
 ? { analytics: savedConsent?.analytics ?? false, marketing: false }
 : savedConsent;
cookieAnalytics.disabled = false;
cookieMarketing.disabled = isGpcEnabled;
cookieAnalytics.checked = effectiveConsent?.analytics ?? false;
cookieMarketing.checked = effectiveConsent?.marketing ?? false;
$('#cookie-signal-text').textContent = isGpcEnabled
 ? 'Sygnał GPC blokuje reklamy i personalizację'
 : 'Analityka i reklamy są domyślnie wyłączone';
applyConsent(effectiveConsent ?? { analytics: false, marketing: false });
cookieBanner.hidden = Boolean(savedConsent && !isGpcEnabled);

const updateCookieActions = (tab: string) => {
 $('#cookie-customize').hidden = tab !== 'consent';
 $('#cookie-allow').hidden = tab !== 'consent';
 $('#cookie-allow').textContent = isGpcEnabled ? 'Akceptuj analitykę' : 'Akceptuj wszystkie';
 $('#cookie-save').hidden = tab !== 'details';
};
const setCookieTab = (tab: string) => {
 document.querySelectorAll<HTMLButtonElement>('[data-cookie-tab]').forEach(button => {
  const selected = button.dataset.cookieTab === tab;
  button.classList.toggle('is-active', selected);
  button.setAttribute('aria-selected', String(selected));
  button.tabIndex = selected ? 0 : -1;
 });
 document.querySelectorAll<HTMLElement>('[data-cookie-panel]').forEach(panel => {
  panel.hidden = panel.dataset.cookiePanel !== tab;
 });
 updateCookieActions(tab);
};
setCookieTab('consent');
document.querySelectorAll<HTMLButtonElement>('[data-cookie-tab]').forEach((button, index, buttons) => {
 button.addEventListener('click', () => setCookieTab(button.dataset.cookieTab!));
 button.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const nextIndex = event.key === 'Home' ? 0
   : event.key === 'End' ? buttons.length - 1
   : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
  buttons[nextIndex].focus();
  buttons[nextIndex].click();
 });
});
const saveConsent = (preferences: ConsentPreferences) => {
 const effectivePreferences = isGpcEnabled
  ? { analytics: preferences.analytics, marketing: false }
  : preferences;
 try {
  localStorage.setItem(consentStorageKey, JSON.stringify(effectivePreferences));
 } catch (error) {
  applyConsent({ analytics: false, marketing: false });
  cookieError.hidden = false;
  console.error('Unable to save privacy preferences.', error);
  return;
 }
 applyConsent(effectivePreferences);
 effectiveConsent = effectivePreferences;
 cookieError.hidden = true;
 cookieBanner.hidden = true;
};
$('#cookie-deny').addEventListener('click', () => saveConsent({ analytics: false, marketing: false }));
$('#cookie-allow').addEventListener('click', () => saveConsent({ analytics: true, marketing: true }));
$('#cookie-customize').addEventListener('click', () => setCookieTab('details'));
$('#cookie-save').addEventListener('click', () => saveConsent({
 analytics: cookieAnalytics.checked,
 marketing: cookieMarketing.checked,
}));
$('#open-consent-settings').addEventListener('click', () => {
 cookieAnalytics.checked = effectiveConsent?.analytics ?? false;
 cookieMarketing.checked = effectiveConsent?.marketing ?? false;
 cookieError.hidden = true;
 cookieBanner.hidden = false;
 setCookieTab('consent');
 $('#cookie-tab-consent').focus();
});
const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });
const setMenu = (open: boolean) => { menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu'); nav.classList.toggle('open', open); };
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menu.focus(); } });
document.addEventListener('click', event => { if (!(event.target as HTMLElement).closest('.site-header')) setMenu(false); });

const openDialog = (dialog: HTMLDialogElement) => dialog.showModal();
document.querySelectorAll<HTMLDialogElement>('dialog').forEach(dialog => {
 dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
 dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
});
document.querySelectorAll<HTMLElement>('[data-detail]').forEach(button => button.addEventListener('click', () => {
 $('#detail-title').textContent = button.dataset.detailTitle!;
 $('#detail-text').textContent = button.dataset.detail!;
 openDialog($<HTMLDialogElement>('#detail-dialog'));
}));

const images = Array.from(document.querySelectorAll<HTMLElement>('.gallery-image')).map(el => ({ src: el.dataset.gallery!, title: el.dataset.caption! }));
let imageIndex = 0;
const showImage = () => { const image = $<HTMLImageElement>('#lightbox-image'); image.src = images[imageIndex].src; image.alt = images[imageIndex].title + ' — zdjęcie inspiracyjne'; $('#gallery-caption').textContent = images[imageIndex].title + ' · ' + (imageIndex + 1) + '/' + images.length; };
document.querySelectorAll<HTMLElement>('[data-gallery]').forEach(button => button.addEventListener('click', () => { imageIndex = images.findIndex(image => image.src === button.dataset.gallery); showImage(); openDialog($<HTMLDialogElement>('#gallery-dialog')); }));
const moveImage = (delta: number) => { imageIndex = (imageIndex + delta + images.length) % images.length; showImage(); };
$('#gallery-prev').addEventListener('click', () => moveImage(-1));
$('#gallery-next').addEventListener('click', () => moveImage(1));
$('#gallery-dialog').addEventListener('keydown', event => { if(event.key === 'ArrowLeft') { event.preventDefault(); moveImage(-1); } if(event.key === 'ArrowRight') { event.preventDefault(); moveImage(1); } });
const track = $('#reviews-track');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const moveReview = (direction: number) => { const card = track.querySelector('article')!; track.scrollBy({ left: direction * (card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap)), behavior: reducedMotion ? 'instant' : 'smooth' }); };
$('#reviews-prev').addEventListener('click', () => moveReview(-1));
$('#reviews-next').addEventListener('click', () => moveReview(1));
const updateReviewButtons = () => { $<HTMLButtonElement>('#reviews-prev').disabled = track.scrollLeft < 2; $<HTMLButtonElement>('#reviews-next').disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2; };
track.addEventListener('scroll', updateReviewButtons, {passive:true});
new ResizeObserver(updateReviewButtons).observe(track);

// Preference-only planner. A real availability provider must be connected before enabling bookings.
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let month = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate: Date | null = null;
let selectedTime = '';
const activity = $<HTMLSelectElement>('#activity');
const participants = $<HTMLInputElement>('#participants');
const continueButton = $<HTMLButtonElement>('#booking-continue');
const formatDate = (date: Date) => date.toLocaleDateString('pl-PL', {day:'numeric', month:'long', year:'numeric'});
const count = () => Math.min(30, Math.max(1, Math.trunc(Number(participants.value)) || 1));
const updateSummary = () => {
 $('#summary-activity').textContent = activity.value;
 $('#summary-date').textContent = selectedDate ? formatDate(selectedDate) : 'Wybierz dzień';
 $('#summary-time').textContent = selectedTime ? selectedTime + ' — preferowana godzina' : 'Wybierz godzinę';
 $('#summary-people').textContent = 'Liczba osób: ' + count();
 $<HTMLButtonElement>('#decrease').disabled = count() <= 1;
 $<HTMLButtonElement>('#increase').disabled = count() >= 30;
 continueButton.disabled = !selectedDate || !selectedTime;
 $('#booking-status').textContent = selectedDate && selectedTime ? `Wybrano ${formatDate(selectedDate)}, ${selectedTime}. Liczba osób: ${count()}. Możesz przejść do podsumowania planu.` : 'Wybierz dzień i godzinę, aby zobaczyć podsumowanie.';
};
const renderCalendar = () => {
 $('#calendar-month').textContent = month.toLocaleDateString('pl-PL', {month:'long', year:'numeric'});
 const days = $('#calendar-days'); days.replaceChildren();
 const offset = (month.getDay() + 6) % 7;
 for(let i = 0; i < offset; i++) { const spacer = document.createElement('span'); spacer.setAttribute('aria-hidden','true'); days.append(spacer); }
 const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
 for(let day = 1; day <= total; day++) {
  const date = new Date(month.getFullYear(), month.getMonth(), day);
  const button = document.createElement('button'); button.type = 'button'; button.textContent = String(day); button.disabled = date < today;
  button.setAttribute('aria-label', formatDate(date) + ' — preferowany termin, podgląd');
  button.setAttribute('aria-pressed', String(selectedDate?.getTime() === date.getTime()));
  if(date.getTime() === today.getTime()) { button.classList.add('today'); button.setAttribute('aria-current','date'); }
  button.addEventListener('click', () => { selectedDate = date; days.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button))); updateSummary(); });
  days.append(button);
 }
 $<HTMLButtonElement>('#prev-month').disabled = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
};
$('#prev-month').addEventListener('click', () => { const previous = new Date(month.getFullYear(), month.getMonth()-1, 1); if(previous < new Date(today.getFullYear(),today.getMonth(),1)) return; month = previous; renderCalendar(); });
$('#next-month').addEventListener('click', () => { month = new Date(month.getFullYear(), month.getMonth()+1, 1); renderCalendar(); });
activity.addEventListener('change', updateSummary);
participants.addEventListener('input', updateSummary);
participants.addEventListener('change', () => { participants.value = String(count()); updateSummary(); });
$('#increase').addEventListener('click', () => { participants.value = String(Math.min(30,count()+1)); updateSummary(); });
$('#decrease').addEventListener('click', () => { participants.value = String(Math.max(1,count()-1)); updateSummary(); });
document.querySelectorAll<HTMLInputElement>('input[name="time"]').forEach(input => input.addEventListener('change', () => { selectedTime = input.value; updateSummary(); }));
document.querySelectorAll<HTMLElement>('[data-offer]').forEach(link => link.addEventListener('click', () => { activity.value = link.dataset.offer!; updateSummary(); }));
const planText = () => `${activity.value}\nDzień: ${selectedDate ? formatDate(selectedDate) : ''}\nPreferowana godzina: ${selectedTime}\nLiczba osób: ${count()}\nCena i dostępność: do potwierdzenia`;
continueButton.addEventListener('click', () => { if(!selectedDate || !selectedTime) return; participants.value = String(count()); $('#final-summary').textContent = planText(); openDialog($<HTMLDialogElement>('#booking-dialog')); });
$('#download-plan').addEventListener('click', () => {
 const content = `SZEPT RZEKI — PLAN WIZYTY\n\n${planText()}\n\nTo plan wizyty, nie rezerwacja. Dostępność i cena nie zostały potwierdzone.\nPlan nie został wysłany do przystani.\n`;
 const url = URL.createObjectURL(new Blob(['\uFEFF' + content], {type:'text/plain;charset=utf-8'})); const link = document.createElement('a'); link.href = url; link.download = 'szept-rzeki-plan-wizyty.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
renderCalendar(); updateSummary(); updateReviewButtons();

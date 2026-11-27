import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "es";

const ES: Record<string, string> = {
  // Header / footer
  "Home": "Inicio",
  "Services": "Servicios",
  "Contact": "Contacto",
  "Get Quote": "Cotizar",
  "Menu": "Menú",
  "Quick Links": "Enlaces",
  "Service Areas": "Zonas de Servicio",
  "Gutter installation, repair and cleaning. Seamless aluminum gutters manufactured and installed in":
    "Instalación, reparación y limpieza de canaletas, además de protectores de hojas. Canaletas de aluminio sin costura fabricadas e instaladas en",
  "License": "Licencia",
  "All rights reserved.": "Todos los derechos reservados.",
  "Manufactured and installed in": "Fabricado e instalado en",

  "Modern gutters for": "Canaletas modernas para",
  "metal roofs": "techos de metal",
  "GUTTERS": "canaletas",
  "A clean look": "Un acabado limpio",
  "for your home.": "para tu hogar.",
  "Our gutter systems complement any style of home with a clean, modern finish.": "Nuestros sistemas de canaletas complementan cualquier estilo de hogar con un acabado limpio y moderno.",
  "Gable Roof": "Techo a dos aguas",
  "Hip Roof": "Techo a cuatro aguas",
  "Mansard Roof": "Techo mansarda",

  // Home hero
  "Seamless gutters in": "Canaletas sin costura en",
  "Your gutter price in": "Tu precio de canaletas en",
  "60 seconds": "60 segundos",
  "Skip the wait. Enter a few details about your home and MetalFlow gives you an instant installation quote, or book a free inspection and we will deliver a specialized quote tailored to protect your foundation.":
    "Sin esperas. Ingresa unos datos de tu casa y MetalFlow te da una cotización de instalación al instante, o agenda una inspección gratis y te entregamos una cotización especializada para proteger tus cimientos.",
  "Call now": "Llama ahora",
  "Get instant quote": "Cotiza al instante",
  "Reviews": "Reseñas",
  "Instant quote": "Cotización instantánea",
  "Online pricing with no sales call needed.": "Precio en línea sin necesidad de llamadas de venta.",
  "Licensed and insured": "Con licencia y asegurados",
  "5 to 8 inch gutters": "Canaletas de 5 a 8 pulgadas",
  "Flat Face, Flat Face One Pencil and Flat Face Double Pencil.": "Flat Face, Flat Face One Pencil y Flat Face Double Pencil.",

  // About
  "About MetalFlow": "Sobre MetalFlow",
  "A real guarantee, written into every job": "Una garantía real en cada trabajo",
  "If a seam leaks, a hanger loosens or water overflows on a run we installed, we come back and fix it. No paperwork games, no subcontractor finger pointing.":
    "Si una unión gotea, un soporte se afloja o el agua se desborda en un tramo que instalamos, regresamos y lo arreglamos. Sin trámites raros ni excusas de subcontratistas.",
  "Workmanship warranty": "Garantía de mano de obra",
  "We stand behind every seam, hanger and downspout we install.":
    "Respaldamos cada unión, soporte y bajante que instalamos.",
  "Our own material": "Material propio",
  "Seamless aluminum formed on site, cut to your exact runs.":
    "Aluminio sin costura formado en sitio y cortado a la medida exacta de tus tramos.",
  "Fast response": "Respuesta rápida",
  "Automated intake means your request never sits in a voicemail.":
    "Nuestro sistema automatizado evita que tu solicitud quede en un buzón de voz.",
  "Clean finish": "Acabado limpio",
  "Debris removed, property left the way we found it.":
    "Retiramos los escombros y dejamos la propiedad como la encontramos.",

  // Solutions
  "Gutter Solutions": "Soluciones de Canaletas",
  "Pick your size, we do the rest": "Elige tu medida, del resto nos encargamos",
  "Price this size": "Cotizar esta medida",
  "Flat Face": "Flat Face",
  "Flat Face One Pencil": "Flat Face One Pencil",
  "Flat Face Double Pencil": "Flat Face Double Pencil",
  "Standard residential runs where roof area and rainfall are moderate.":
    "Tramos residenciales estándar donde el área de techo y la lluvia son moderadas.",
  "The South Florida favorite, extra capacity for heavy rain.":
    "La favorita del sur de Florida, con capacidad extra para lluvias fuertes.",
  "Large roofs and long runs that push a lot of water.":
    "Techos grandes y tramos largos que mueven mucha agua.",
  "Commercial and modern architectural builds with high flow.":
    "Obras comerciales y arquitectura moderna con alto flujo de agua.",

  // Services
  "What we do": "Lo que hacemos",
  "Focused gutter services": "Servicios de canaletas puntuales",
  "See all services": "Ver todos los servicios",
  "Our Services": "Nuestros Servicios",
  "Four services, done right": "Cuatro servicios, bien hechos",
  "Get an instant quote": "Obtén una cotización instantánea",
  "Gutter Installation": "Instalación de Canaletas",
  "Gutter Repair": "Reparación de Canaletas",
  "Gutter Cleaning": "Limpieza de Canaletas",
  "Leaf Guard": "Protector de Hojas",
  "Seamless aluminum gutters in 5, 6, 7 and 8 inches, installed the right way the first time.":
    "Canaletas de aluminio sin costura en 5, 6, 7 y 8 pulgadas, instaladas bien desde la primera vez.",
  "Leaks, sagging runs, loose hangers and damaged downspouts fixed fast.":
    "Goteras, tramos caídos, soportes flojos y bajantes dañados reparados rápido.",
  "Full flush of gutters and downspouts so water moves away from your foundation.":
    "Lavado completo de canaletas y bajantes para que el agua se aleje de tus cimientos.",
  "Bull Dog leaf protection that keeps debris out and water flowing.":
    "Protección Bull Dog que mantiene fuera la basura y el agua fluyendo.",
  "Seamless aluminum in 5, 6, 7 and 8 inches": "Aluminio sin costura en 5, 6, 7 y 8 pulgadas",
  "Flat Face, Flat Face One Pencil and Flat Face Double Pencil profiles": "Perfiles Flat Face, Flat Face One Pencil y Flat Face Double Pencil",
  "Hidden hangers and sealed corners": "Soportes ocultos y esquinas selladas",
  "Downspouts sized for Florida rain": "Bajantes dimensionados para la lluvia de Florida",
  "Leak and seam repair": "Reparación de goteras y uniones",
  "Re pitch of sagging runs": "Corrección de pendiente en tramos caídos",
  "Hanger and fascia repair": "Reparación de soportes y fascia",
  "Downspout replacement": "Reemplazo de bajantes",
  "Full debris removal": "Retiro completo de escombros",
  "Downspout flush and flow test": "Lavado de bajantes y prueba de flujo",
  "Roof edge inspection": "Inspección del borde del techo",
  "Before and after report": "Reporte de antes y después",
  "Bull Dog leaf protection": "Protección de hojas Bull Dog",
  "Fits new and existing gutters": "Se adapta a canaletas nuevas y existentes",
  "Keeps leaves and nests out": "Mantiene fuera hojas y nidos",
  "Less maintenance year round": "Menos mantenimiento todo el año",
  "We keep it simple and focused so every job moves fast. Installation, repair and cleaning across South Florida, backed by license":
    "Lo mantenemos simple y enfocado para que cada trabajo avance rápido. Instalación, reparación, limpieza y protector de hojas en todo el sur de Florida, con licencia",

  // Reviews / areas / CTA
  "What homeowners say": "Lo que dicen los clientes",
  "Our first reviews are on the way.": "Nuestras primeras reseñas están en camino.",
  "from": "de",
  "reviews": "reseñas",
  "Where we work": "Dónde trabajamos",
  "Ready for your number?": "¿Listo para tu precio?",
  "Get an instant quote online or request a free inspection. Either way you hear from us fast.":
    "Recibe una cotización en línea o solicita una inspección gratis. En ambos casos te respondemos rápido.",
  "Get quote": "Cotizar",
  "Licensed": "Con licencia",

  // Contact
  "Talk to MetalFlow": "Habla con MetalFlow",
  "Send your details and our team responds fast, or call now and get answers on the spot.":
    "Envía tus datos y nuestro equipo responde rápido, o llama ahora y obtén respuestas al momento.",
  "Thank you": "Gracias",
  "Your request is in our system. Our team will reach out shortly.":
    "Tu solicitud está en nuestro sistema. Nuestro equipo te contactará en breve.",
  "Full name": "Nombre completo",
  "Phone": "Teléfono",
  "Email": "Correo",
  "City": "Ciudad",
  "Select your city": "Selecciona tu ciudad",
  "Search your city": "Busca tu ciudad",
  "Email us": "Escríbenos",
  "Back to home": "Volver al inicio",
  "Other": "Otra",
  "Address": "Dirección",
  "Service": "Servicio",
  "How can we help?": "¿Cómo podemos ayudarte?",
  "Sending": "Enviando",
  "Send message": "Enviar mensaje",
  "Please add your name, email and phone.": "Agrega tu nombre, correo y teléfono.",
  "Please accept to be contacted about your quote.": "Acepta ser contactado sobre tu cotización.",
  "I agree to be contacted by phone, text or email about my quote. Your information stays private and is only used for this request.":
    "Acepto ser contactado por teléfono, mensaje o correo sobre mi cotización. Tu información es privada y solo se usa para esta solicitud.",
  "We could not send your message. Please call us.": "No pudimos enviar tu mensaje. Por favor llámanos.",
  "Message sent. We will contact you shortly.": "Mensaje enviado. Te contactaremos en breve.",

  // Service area page
  "Service Area": "Zona de Servicio",
  "Gutter services in": "Servicios de canaletas en",
  "Get instant price": "Ver precio al instante",
  "Licensed and insured crews": "Cuadrillas con licencia y seguro",
  "Other areas we serve": "Otras zonas que atendemos",
  "Area not found": "Zona no encontrada",
  "Go home": "Ir al inicio",
  "in": "en",

  // Quote dialog
  "Get your quote": "Obtén tu cotización",
  "Request received": "Solicitud recibida",
  "Choose how you want your price.": "Elige cómo quieres tu precio.",
  "Tell us about your home and get an instant quote.":
    "Cuéntanos sobre tu casa y recibe una cotización al instante.",
  "This is your instant quote for standard installation.":
    "Esta es tu cotización instantánea para instalación estándar.",
  "We will contact you shortly.": "Te contactaremos en breve.",
  "Last step, how can we reach you.": "Último paso, cómo te contactamos.",
  "Request a quote and inspection": "Solicitar cotización e inspección",
  "Our team visits, measures and confirms the final price.":
    "Nuestro equipo visita, mide y confirma el precio final.",
  "Do it yourself in one minute": "Hazlo tú mismo en un minuto",
  "Enter a few details about your home and see your price right now.":
    "Ingresa unos datos de tu casa y ve tu precio ahora mismo.",
  "Gutter size": "Medida de canaleta",
  "Style": "Estilo",
  "How many feet of gutter do you need?": "¿Cuántos pies de canaleta necesitas?",
  "How many gutter corners?": "¿Cuántas esquinas de canaleta?",
  "How many floors does your home have?": "¿Cuántos pisos tiene tu casa?",
  "How many downspouts do you need?": "¿Cuántos bajantes necesitas?",
  "How many linear feet of downspout do you need?": "¿Cuántos pies lineales de bajante necesitas?",
  "All downspouts are corrugated. You can leave this at zero.": "Todos los bajantes son corrugados. Puedes dejarlo en cero.",
  "Downspout size": "Tamaño del bajante",
  "corrugated": "corrugado",
  "We always plan at least one downspout every 50 feet of gutter.":
    "Siempre calculamos al menos un bajante por cada 50 pies de canaleta.",
  "How many 2 floor downspouts?": "¿Cuántos bajantes de 2 pisos?",
  "How many 3 floor downspouts?": "¿Cuántos bajantes de 3 pisos?",
  "See my price": "Ver mi precio",
  "Standard installation, taxes not included.": "Instalación estándar, impuestos no incluidos.",
  "Three services, done right": "Tres servicios, bien hechos",
  "Request a personalized inspection": "Solicite una inspeccion personalizada",
  "For new installations, repairs or cleaning. Our team visits, measures and confirms the final price.":
    "Para instalaciones nuevas, reparaciones o limpiezas. Nuestro equipo visita, mide y confirma el precio final.",
  "Instant price for a new installation": "Precio instantaneo para una instalacion nueva",
  "This is your final price for a new installation.": "Este es su precio final para una instalacion nueva.",
  "First, tell us how to reach you.": "Primero, diganos como contactarlo.",
  "Price includes labor, high quality installation, hangers, screws and all materials needed. No hidden fees, pay exactly this and get your gutters.":
    "El precio incluye mano de obra, instalacion de alta calidad, hangers, tornillos y todos los materiales necesarios. Sin gastos ocultos, paga exactamente esto y recibe sus canaletas.",
  "Add leaf guard and forget about cleaning your gutters": "Anada leaf guard y olvidese de limpiar sus canaletas",
  "Ask our team to include leaf protection with your installation.":
    "Pida a nuestro equipo incluir proteccion de hojas con su instalacion.",
  "Gutter feet": "Pies de canaleta",
  "Rate per foot": "Precio por pie",
  "Gutter total": "Total de canaletas",
  "Downspout feet": "Pies de bajante",
  "Downspout total": "Total de bajantes",
  "Lock this price": "Fijar este precio",
  "Continue": "Continuar",
  "First, tell us how to reach you and what service you need.": "Primero, dinos como contactarte y que servicio necesitas.",
  "Instant pricing is available for gutter installation only. We will contact you with a price for this service.": "El precio instantaneo solo aplica para instalacion de canaletas. Te contactaremos con el precio de este servicio.",

  "Thanks. Your request is in our system and our team will reach out shortly.":
    "Gracias. Tu solicitud está en nuestro sistema y nuestro equipo te contactará en breve.",
  "Close": "Cerrar",
  "Details": "Detalles",
  "Send request": "Enviar solicitud",
  "We could not send your request. Please call us.": "No pudimos enviar tu solicitud. Por favor llámanos.",
  "inch": "pulgadas",
  "MetalFlow installs, repairs and cleans seamless aluminum gutters across":
    "MetalFlow instala, repara y limpia canaletas de aluminio sin costura en",
  "Same crews, same standard, backed by license": "Las mismas cuadrillas, el mismo estándar, con licencia",
  "MetalFlow is a licensed gutter company based in": "MetalFlow es una empresa de canaletas con licencia con base en",
  "We roll form our own seamless aluminum on site, so the material, the install and the warranty all come from the same team.":
    "Formamos nuestro propio aluminio sin costura en sitio, así que el material, la instalación y la garantía vienen del mismo equipo.",
  "Quality that channels every drop": "Calidad que canaliza cada gota",
  "We run mobile roll form machines, so we form seamless aluminum right at your property in Flat Face, Flat Face One Pencil and Flat Face Double Pencil profiles.": "Contamos con maquinas roll form moviles y formamos aluminio sin costuras en su propiedad en perfiles Flat Face, Flat Face One Pencil y Flat Face Double Pencil.",
  "We are also one of the few companies that install on mansard roofs. If a seam leaks, a hanger loosens or water overflows on a run we installed, we come back and fix it. No paperwork games, no subcontractor finger pointing.": "Somos tambien una de las pocas companias que instala en techos mansard. Si una union gotea, un soporte se afloja o el agua se desborda en un tramo que instalamos, regresamos y lo reparamos.",
  "Roll form on site": "Roll form en sitio",
  "Mobile roll form machines produce your gutters at your property.": "Maquinas roll form moviles producen sus canaletas en su propiedad.",
  "Three premium profiles": "Tres perfiles premium",
  "Flat Face, Flat Face One Pencil and Flat Face Double Pencil profiles.": "Perfiles Flat Face, Flat Face One Pencil y Flat Face Double Pencil.",
  "Mansard roofs": "Techos mansard",
  "One of the few teams equipped to install on mansard roof lines.": "Uno de los pocos equipos capacitados para instalar en techos mansard.",
  "How many of your downspouts run down 2 floors?": "¿Cuantos de sus bajantes bajan 2 niveles?",
  "How many of your downspouts run down 3 floors?": "¿Cuantos de sus bajantes bajan 3 niveles?",
  "You can leave this at zero if every downspout ends on the lower roof.": "Puede dejarlo en cero si todos los bajantes terminan en el techo bajo.",

  // Home promo
  "No roof yet?": "¿Aún no tienes techo?",
  "Request a quote for a metal roof": "Solicita cotización de un metal roof",
  "Metal roof installation quote": "Cotización de instalación de metal roof",
  "Tell us about your property and our team will confirm the price for your new metal roof.":
    "Cuéntanos sobre tu propiedad y nuestro equipo confirmará el precio de tu nuevo metal roof.",
  "Metal Roof Installation": "Instalación de Metal Roof",
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (s: string) => string };


const LangCtx = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (s) => s });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("mf_lang") : null;
    if (stored === "es" || stored === "en") setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem("mf_lang", l);
    if (typeof document !== "undefined") document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (s: string) => {
      if (lang === "en") return s;
      const key = s.replace(/\s+/g, " ").trim();
      return ES[key] ?? s;
    },
    [lang],
  );

  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

export function useT() {
  return useContext(LangCtx).t;
}

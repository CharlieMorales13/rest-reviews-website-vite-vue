/**
 * seed-reviews.mjs
 * Registra 100 usuarios estudiantes e inyecta 100 reseñas por establecimiento
 * (400 total). Cada usuario reseña los 4 establecimientos una vez.
 *
 * Uso: node scripts/seed-reviews.mjs
 */

const BASE_URL     = 'http://localhost:3000';
const SEED_PASSWORD = 'Seed2026!';

// ── Establecimientos ─────────────────────────────────────────────────────────
const ESTABLISHMENTS = [
  { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', label: 'DelyFull',      key: 'delyFull'     },
  { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', label: 'Guajaquenito',  key: 'guajaquenito' },
  { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b23', label: 'Cuckoo Resto',  key: 'cuckooResto'  },
  { id: '96e8f23d-08d6-400e-9d26-03d05edbd74f', label: 'Cuckoo Box',    key: 'cuckooBox'    },
];

const CARRERAS = [
  'Administración de Empresas', 'Administración Turística', 'Colaboradores',
  'Comunicación', 'Derecho', 'Diseño de Moda e Innovación', 'Diseño Gráfico',
  'Diseño Industrial', 'Diseño Multimedia', 'Egresados',
  'Finanzas y Contaduría Pública', 'Gastronomía', 'Ingeniería Biomédica',
  'Ingeniería Civil', 'Ingeniería Industrial para la Dirección',
  'Ingeniería Mecatrónica', 'Ingeniería en Tecnologías de la Información y Negocios Digitales',
  'Médico Cirujano', 'Mercadotecnia Estratégica', 'Psicología',
];

// ── Generación de 100 usuarios seed ─────────────────────────────────────────
const FIRST_NAMES = [
  'Ana', 'Beatriz', 'Carlos', 'Diana', 'Eduardo',
  'Fernanda', 'Gabriel', 'Hilda', 'Ivan', 'Julia',
  'Kevin', 'Laura', 'Miguel', 'Natalia', 'Oscar',
  'Patricia', 'Roberto', 'Sofia', 'Tomas', 'Valentina',
];
const LAST_NAMES = [
  'Garcia', 'Lopez', 'Martinez', 'Gonzalez', 'Rodriguez',
  'Hernandez', 'Perez', 'Sanchez', 'Torres', 'Flores',
];

const normalize = s =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '.');

const USERS = Array.from({ length: 100 }, (_, i) => {
  const firstName = FIRST_NAMES[i % 20];
  const lastName  = LAST_NAMES[Math.floor(i / 10)];
  return {
    name:     `${firstName} ${lastName}`,
    email:    `${normalize(firstName)}.${normalize(lastName)}${i + 1}@anahuac.mx`,
    password: SEED_PASSWORD,
    carrera:  CARRERAS[i % CARRERAS.length],
  };
});

// ── Pools de reseñas ─────────────────────────────────────────────────────────
// Formato: [foodScore, serviceScore, priceScore, title, comment]
// ~50 entradas por establecimiento; los 100 usuarios ciclan → cada texto aparece 2 veces

const POOLS = {

  // ── DelyFull ────────────────────────────────────────────────────────────────
  delyFull: [
    // POSITIVAS
    [5,5,5,'Tortas insuperables del campus','Las tortas de DelyFull son increíbles, el pan siempre fresco y el relleno generoso. El mejor lugar para comer entre clases sin gastar mucho.'],
    [5,4,4,'Quesadillas de huitlacoche auténticas','Pedí la quesadilla de huitlacoche y quedé muy satisfecho, el sabor fue auténtico y la porción más que suficiente para una comida completa.'],
    [4,5,4,'Servicio rápido y enchiladas deliciosas','El servicio fue muy amable, me atendieron rápido y la comida llegó caliente. Las enchiladas verdes estaban deliciosas y bien condimentadas.'],
    [5,4,5,'Excelente relación precio-calidad','Excelente relación precio-calidad. Por menos de cincuenta pesos comí una torta completa con agua fresca incluida, muy recomendable para el presupuesto universitario.'],
    [4,4,4,'Sopa del día que sorprendió','La sopa del día estuvo muy sabrosa, me sorprendió la calidad considerando que es comida universitaria. El personal fue amable y eficiente durante toda la atención.'],
    [5,5,4,'Tacos preparados al momento','Los tacos de DelyFull son de lo mejor del campus, la carne bien sazonada y las tortillas hechas al momento. Sin duda volvería a pedir este plato.'],
    [4,5,5,'Ensalada con pollo en cinco minutos','Muy buena atención, pedí la ensalada con pollo y llegó en menos de cinco minutos. Los precios son muy accesibles para ser comida universitaria del campus.'],
    [5,4,4,'Torta de pierna perfectamente caliente','La torta de pierna estuvo deliciosa, bien caliente y con todos los ingredientes frescos. El servicio fue rápido a pesar de que había mucha gente esperando.'],
    [5,5,4,'El mejor desayuno del campus','El desayuno con chilaquiles verdes fue impresionante, la salsa bien picante y los huevos perfectos. Definitivamente el mejor desayuno que he probado en el campus.'],
    [4,4,5,'Precio muy justo para la calidad','Me sorprendió lo bien preparado que estaba el pozole rojo. La cantidad fue generosa y el precio muy justo. El personal me trató con amabilidad desde que llegué.'],
    [5,4,4,'Caldito de pollo reconfortante','El caldo de pollo en día lluvioso fue exactamente lo que necesitaba. Bien sazonado, con verduras frescas y una porción generosa de pecho de pollo bien cocido.'],
    [4,5,4,'Atención excepcional en hora pico','A pesar de la fila larga en hora de comida, el personal mantuvo la calma y atendió a todos con una sonrisa. La torta de jamón con queso estuvo perfecta.'],
    [5,4,5,'Agua fresca natural incluida','El menú del día incluye agua fresca natural sin costo adicional. La comida estuvo deliciosa y por ese precio es prácticamente imbatible en todo el campus universitario.'],
    [4,4,4,'Tacos de canasta frescos','Los tacos de canasta llegaron calientes y bien condimentados. La variedad que ofrecen es buena y el precio es muy accesible para el bolsillo de cualquier estudiante.'],
    [5,5,5,'Experiencia culinaria completa','Vine por primera vez y quedé completamente enamorado del lugar. La comida, el servicio y los precios son perfectos. Ya es mi lugar favorito para comer en el campus.'],
    [4,4,4,'Milanesa empanizada perfecta','La milanesa de res estaba perfectamente empanizada y crujiente por fuera, jugosa por dentro. El arroz y los frijoles que la acompañaban también estaban muy bien preparados.'],
    [5,3,4,'Sabor inigualable aunque tardaron','El sabor de la comida es inigualable en el campus universitario. Tardaron un poco más de lo usual pero valió completamente la pena esperar por esa calidad tan buena.'],
    [4,5,4,'Limpieza impecable en el área','Lo que más me llamó la atención fue la limpieza del lugar. Mesas siempre limpias y el personal usa guantes. La comida también estuvo muy sabrosa y bien presentada.'],
    // NEUTRAS
    [3,3,3,'Comida correcta para el día','La comida estuvo bien, nada extraordinario pero cumple su función. Las quesadillas son normales, el servicio tarda un poco en hora pico pero al final llega.'],
    [3,4,3,'Tacos de bistec regulares','Pedí los tacos de bistec y estuvieron regulares, la carne un poco seca pero las tortillas estaban bien. El precio es razonable para lo que ofrecen en el campus.'],
    [4,3,3,'Pan un poco duro en la torta','La torta de milanesa estaba bien pero el pan estaba un poco duro. El servicio fue correcto aunque tuvieron que repetir mi orden dos veces antes de que llegara.'],
    [3,3,4,'Cumple pero no destaca','Comida correcta y precios justos. No es el mejor lugar del campus pero es conveniente y rápido cuando tienes poco tiempo disponible entre una clase y otra.'],
    [3,4,4,'Mole de lata pero arroz casero','Pedí las enchiladas rojas y estuvieron aceptables, el mole era de lata pero el arroz sí estaba bien hecho. El personal fue amable durante mi tiempo de espera.'],
    [4,3,3,'Pozole con porción pequeña','El pozole del día estuvo bueno pero la porción fue un poco chica para el precio cobrado. El servicio fue normal, sin nada destacable positivo ni negativo en la experiencia.'],
    [3,3,3,'Sabor aceptable sin más','La comida cumplió su función nutritiva pero no me emocionó especialmente. El ambiente es ruidoso en horas pico y la atención fue bastante estándar sin destacarse mucho.'],
    [3,4,3,'Opciones limitadas ese día','El menú del día tenía pocas opciones cuando llegué. Lo que pedí estuvo bien preparado aunque esperaba más variedad. El servicio fue eficiente y sin complicaciones.'],
    [4,3,4,'Buena opción rápida','Para una comida rápida entre clases cumple perfectamente. Los precios son accesibles aunque la calidad no siempre es constante. Algunas visitas mejor que otras en general.'],
    // NEGATIVAS
    [1,2,2,'Torta fría después de veinte minutos','La torta llegó completamente fría y el pan estaba duro, tuve que esperar casi veinte minutos y al final la comida no valió la pena el tiempo perdido esperando.'],
    [2,1,2,'Servicio lento y grosero','El servicio fue muy lento y grosero, pedí una quesadilla sencilla y tardé quince minutos. La comida llegó tibia y sin el queso extra que pedí y pagué.'],
    [2,2,1,'Precios altos para la calidad baja','Los precios subieron pero la calidad bajó mucho. Pagué ochenta pesos por una torta pequeña y fría, definitivamente no volvería a pedir en este establecimiento.'],
    [1,3,2,'Tacos crudos que me enfermaron','Los tacos de bistec estaban crudos por dentro y con muy poco relleno. Fue una experiencia terrible, me dolió el estómago después de comer y perdí toda la tarde.'],
    [2,2,2,'Arroz duro y frijoles aguados','La comida estuvo muy por debajo de las expectativas. El arroz estaba duro, los frijoles aguados y el pollo completamente sin sabor. No lo recomendaría a nadie.'],
    [2,1,3,'Me cobraron de más y fueron groseros','Me cobraron de más y cuando lo señalé el encargado fue grosero e irrespetuoso. La comida además estaba fría. Una experiencia muy desagradable que no repetiría jamás.'],
    [1,2,2,'Sopa fría con fideos pasados','Pedí la sopa de fideos y llegó fría con fideos pasados de cocción. La presentación era descuidada y el sabor muy insípido para el precio que cobran actualmente.'],
    [2,3,1,'Precios abusivos para la calidad','Los precios son abusivos para la calidad que ofrecen. Por esa cantidad de dinero esperaría al menos que la comida llegara caliente y bien condimentada para comer.'],
    [3,2,2,'Tardaron sin dar explicación','El servicio tardó demasiado y cuando reclamé me dijeron que esperara sin dar ninguna explicación. La comida llegó regular, ni buena ni terrible al final del día.'],
    [2,2,2,'Tortilla quemada y relleno escaso','La tortilla de los tacos estaba quemada y el relleno escaso. Para el precio que manejan esperaba mucha más cantidad y calidad en cada uno de los platillos pedidos.'],
    [1,1,2,'Cabello en la comida sin disculpa','Encontré un cabello en mi comida y cuando lo reporté nadie se disculpó ni ofreció ninguna solución. Pésima higiene y peor actitud del personal de cocina presente.'],
    [2,2,2,'Sabor artificial en todo','Todo sabía a condimento artificial de bolsa. La comida no parece preparada con ingredientes frescos y la presentación era muy descuidada para lo que cobran.'],
    [1,2,1,'La peor experiencia del campus','Definitivamente el peor lugar del campus para comer. Comida de mala calidad, servicio pésimo y precios que no se justifican de ninguna manera con lo que recibes.'],
    [2,3,2,'Orden equivocada y sin solución','Me trajeron la orden equivocada y cuando lo señalé tardaron otros diez minutos en traer lo correcto, que llegó tibio. La experiencia completa fue muy frustrante.'],
    [3,1,2,'Actitud del personal muy mala','La comida no era lo peor de la visita sino la actitud del personal, que fue de lo más antipático e indiferente ante cualquier consulta que hice sobre el menú.'],
    [2,2,3,'Inconsistente en calidad','He venido varias veces y la calidad es muy inconsistente. Un día puede estar bien y otro día es francamente malo. No se puede confiar en una experiencia estable.'],
  ],

  // ── Guajaquenito ────────────────────────────────────────────────────────────
  guajaquenito: [
    // POSITIVAS
    [5,5,4,'Tlayuda auténtica oaxaqueña','La tlayuda de Guajaquenito es auténtica oaxaqueña, con quesillo fresco y tasajo bien asado. Una experiencia gastronómica que vale cada peso pagado en el campus.'],
    [5,4,5,'Mole negro con sabor complejo','El mole negro es increíble, con la complejidad de sabores que solo la cocina oaxaqueña puede ofrecer. Los tamales de rajas también estaban absolutamente exquisitos.'],
    [4,5,4,'Personal que explica cada platillo','Excelente atención, el personal explica cada platillo con orgullo genuino. El membrillo con queso como postre fue la perfecta conclusión de una gran comida oaxaqueña.'],
    [5,4,4,'Estofado oaxaqueño revelador','Pedí el estofado de Oaxaca y fue una revelación culinaria. La carne suave, la salsa equilibrada y las verduras frescas. Muy recomendable para conocer la cocina local.'],
    [4,4,5,'Memelas perfectas de sabor','Los precios son muy justos considerando la calidad y autenticidad de la cocina oaxaqueña que ofrecen. Las memelas estaban perfectas de sabor y consistencia al morderlas.'],
    [5,5,5,'Todo excepcional en Guajaquenito','Todo en Guajaquenito es excepcional: la comida auténtica, el servicio cálido y los precios accesibles. El mole amarillo superó completamente mis expectativas del día.'],
    [4,4,4,'Tasajo bien condimentado','El tasajo asado estaba perfectamente condimentado y la porción generosa. Vine acompañado y todos quedamos muy satisfechos con los platillos que ordenamos esa tarde.'],
    [5,3,4,'Mole coloradito insuperable','La comida es extraordinaria, el mole coloradito de los domingos es insuperable en el campus. Solo el servicio podría mejorar en tiempo de respuesta durante horas pico.'],
    [5,4,5,'Chapulines crujientes únicos','Los chapulines con limón y sal son una experiencia única para quienes no somos de Oaxaca. Crujientes, sabrosos y perfectos como botana antes del plato principal.'],
    [4,5,4,'Atención personalizada y cálida','El nivel de atención personalizada que da el personal de Guajaquenito no lo he encontrado en ningún otro lugar del campus. La comida también estuvo a la altura de todo.'],
    [5,4,4,'Caldillo de tasajo reconfortante','El caldillo de tasajo es un plato reconfortante y lleno de sabores tradicionales oaxaqueños. La porción fue generosa y el precio muy justo para la calidad recibida.'],
    [4,4,5,'Precio menor que en restaurante','Por el precio de una comida universitaria te dan una experiencia de restaurante oaxaqueño. Los ingredientes son frescos y la preparación claramente artesanal y casera.'],
    [5,5,4,'Tamales de chipilín únicos','Los tamales de chipilín son únicos en el campus, preparados de forma tradicional con hoja de plátano. El sabor herbáceo y suave es completamente diferente a los tamales comunes.'],
    [4,4,4,'Nieve de tuna refrescante','La nieve de tuna como postre fue el cierre perfecto para la comida oaxaqueña. Fresca, natural y con un sabor que no encontrarías en ningún otro lugar del campus universitario.'],
    [5,4,4,'Salsa negra para recordar','La salsa negra de chiles quemados que acompaña los platos es adictiva. Picante pero con un sabor ahumado profundo que complementa perfectamente cualquier platillo del menú.'],
    [4,5,5,'Mejor inversión en el campus','Invertir en una comida en Guajaquenito es la mejor decisión que puedes tomar en el campus. Auténtico, delicioso y accesible. No hay ningún otro lugar que ofrezca esto.'],
    [5,4,4,'Mole negro que no decepciona','Cada vez que vengo el mole negro mantiene el mismo nivel de calidad excepcional. La consistencia en la preparación demuestra el compromiso con la cocina oaxaqueña auténtica.'],
    [4,4,5,'Combinación perfecta de sabores','La combinación de tasajo, quesillo y chapulines en un mismo plato es simplemente perfecta. Los sabores se complementan de manera increíble y la porción es muy generosa.'],
    // NEUTRAS
    [3,3,3,'Auténtico pero pesado para algunos','La comida es auténtica oaxaqueña pero para quienes no estamos acostumbrados al mole puede resultar muy pesada. El servicio fue normal y los precios razonables para el campus.'],
    [4,3,3,'Tamales bien pero menos sabor','Los tamales de chipilín estaban bien pero esperaba un sabor más intenso. El servicio tardó bastante aunque al final la calidad de la comida compensó parcialmente la espera.'],
    [3,4,3,'Tlayuda muy grande para uno','Pedí la tlayuda y la encontré demasiado grande para terminarla sola. El sabor era correcto pero no me convenció del todo el nivel de picante de la salsa que traía.'],
    [3,3,4,'Condimentado en exceso para mi gusto','Comida típica oaxaqueña correcta, aunque algunos platillos estaban demasiado condimentados para mi gusto personal. Los precios son adecuados para la oferta gastronómica que presentan.'],
    [4,3,3,'Postre bueno, plato principal frío','El membrillo con queso como postre estuvo bueno, aunque la orden principal del estofado estaba un poco fría. El servicio fue amable pero lento en horario de comida pico.'],
    [3,3,3,'Experiencia regular en general','Experiencia regular, la comida cumple con ser típica oaxaqueña pero no superó expectativas. El ambiente es ruidoso en hora pico y el servicio no fue muy atento conmigo.'],
    [4,3,3,'Chapulines interesantes sin más','Los chapulines me parecieron interesantes de probar pero no me convencieron del todo para pedirlos de nuevo. El resto de la comida estuvo correcto y los precios accesibles.'],
    [3,4,4,'Regular pero con identidad','La comida tiene identidad propia y eso se agradece, aunque no siempre la ejecución está a la altura. Algunos días mejor que otros, lo que hace la experiencia inconsistente.'],
    [4,3,3,'Atención lenta pero amable','El personal es amable aunque lento para tomar la orden cuando el local está lleno. La comida llegó a tiempo y el sabor fue aceptable para ser comida de campus universitario.'],
    // NEGATIVAS
    [2,2,2,'Mole frío con textura extraña','El mole llegó frío y con una consistencia extraña, nada parecido a un mole auténtico. Para el precio que cobran esperaba mucha más calidad y autenticidad en la preparación.'],
    [1,2,2,'Tamales fríos con poco relleno','Los tamales estaban fríos y con muy poco relleno. Pagué un precio considerable y recibí algo que claramente no era casero ni fresco. Una experiencia muy decepcionante.'],
    [2,1,3,'Mesero que me ignoró diez minutos','El servicio fue pésimo, el mesero me ignoró durante diez minutos a pesar de estar parado frente a él. La tlayuda llegó sin el quesillo que pedí y pagué especialmente.'],
    [3,2,1,'Precios exagerados para cafetería','Los precios son exagerados para una cafetería universitaria. Pagué ciento veinte pesos por una porción pequeña de tasajo que en cualquier mercado costaría la mitad del precio.'],
    [2,3,2,'Mole con sabor artificial de pasta','El mole negro tenía un sabor artificial, claramente hecho con pasta comercial en lugar de preparación artesanal. Para llamarse cocina oaxaqueña debería ser mucho más auténtico.'],
    [1,2,2,'Olor raro y personal sin empatía','Encontré la comida con un olor raro y decidí no terminarla. El personal no fue empático cuando lo comenté. La higiene del lugar deja mucho que desear en general.'],
    [2,1,2,'Cuarenta minutos y llegó frío','Tardaron cuarenta minutos en traer mi orden y cuando llegó estaba completamente fría. Le pedí que la calentaran y el encargado me dijo que no era posible hacerlo.'],
    [2,2,1,'Calidad de restaurante económico mal ejecutado','Precios de restaurante gourmet con calidad de comida rápida congelada. La tlayuda llegó con la masa cruda por un lado y quemada por el otro. Muy mala experiencia.'],
    [3,2,2,'Me cobraron platillo diferente','El servicio es desorganizado, me cobraron un platillo diferente al que pedí. La comida estaba pasable pero la experiencia en general fue bastante frustrante e innecesaria.'],
    [1,3,2,'Mole sin sabor para ser oaxaqueño','La tortilla de los tamales estaba correosa y el mole sin sabor. Para ser un lugar que presume cocina oaxaqueña auténtica la ejecución fue realmente decepcionante y triste.'],
    [2,2,2,'Estofado frío con carne dura','Pedí el estofado y llegó frío con la carne dura. La presentación era descuidada y el sabor muy genérico. No recomendaría este lugar a nadie que quiera cocina oaxaqueña real.'],
    [2,1,2,'Experiencia que no repetiría','La experiencia en Guajaquenito fue completamente decepcionante. Esperaba autenticidad oaxaqueña y recibí comida de baja calidad con un servicio que dejó mucho que desear.'],
    [1,2,3,'Higiene cuestionable en la cocina','Desde que me senté noté que la cocina no tenía las mejores condiciones de higiene. La comida en consecuencia no me convenció y decidí no terminar el plato principal pedido.'],
    [3,1,2,'Desorganización total en el servicio','La desorganización del servicio arruinó lo que podría haber sido una buena experiencia gastronómica. Confundieron órdenes, tardaron mucho y la actitud no fue la adecuada.'],
  ],

  // ── Cuckoo Coffee & Resto ────────────────────────────────────────────────────
  cuckooResto: [
    // POSITIVAS
    [5,5,4,'Capuchino perfecto con crema ideal','El capuchino de Cuckoo Coffee es de los mejores del campus, bien preparado con una crema perfecta. El brownie que pedí de postre también estaba absolutamente excepcional.'],
    [4,5,4,'Ambiente ideal para estudiar','Vine a estudiar y el ambiente es ideal: tranquilo, con buen wifi y el café llegó exactamente como lo pedí. Los sándwiches también son muy buenos con ingredientes frescos.'],
    [5,4,5,'Pasta carbonara cremosa y generosa','El menú de lunch es muy completo y a precios razonables. La pasta carbonara estaba cremosa y la porción generosa. El servicio fue rápido y muy amable durante toda la visita.'],
    [4,4,4,'Americano perfecto entre clases','Muy buen lugar para tomar un descanso entre clases. El americano estuvo perfectamente preparado y el personal fue atento sin ser intrusivo durante toda mi estancia ahí.'],
    [5,5,5,'El mejor lugar para reuniones','Cuckoo Coffee es el mejor lugar del campus para reuniones de trabajo. El espresso doble estuvo perfecto y la ensalada César llegó fresca y bien aderezada para comer.'],
    [4,4,5,'Sándwich de pavo fresco y rico','Precios muy justos para la calidad que ofrecen. Pedí el sandwich de pavo y estaba fresco con ingredientes de buena calidad. El té helado también estuvo excelente y refrescante.'],
    [5,4,4,'Frappuccino que salva exámenes','El frappuccino de caramelo fue exactamente lo que necesitaba para aguantar la tarde de exámenes. El personal fue muy amable y rápido para atender el pedido desde el inicio.'],
    [4,5,4,'Barista con excelentes recomendaciones','Excelente servicio, el barista supo recomendarme la bebida perfecta para mi gusto personal. La pasta del día también estaba muy bien preparada y la porción fue suficiente.'],
    [5,4,4,'Pastel de chocolate que enamoró','El pastel de chocolate con ganache fue una revelación. Húmedo, intenso y con un nivel de dulzor perfecto. Definitivamente el mejor postre que he probado en todo el campus.'],
    [4,5,5,'Café de especialidad bien preparado','Por fin un lugar en el campus que prepara el café como debe ser. Los granos son de calidad y el barista conoce las técnicas de extracción. El resultado habla por sí mismo.'],
    [5,4,4,'Wifi rápido y enchufes disponibles','El wifi funciona perfectamente y hay enchufes en casi todas las mesas. Perfecto para sesiones largas de estudio. El café y los snacks también son de muy buena calidad.'],
    [4,4,4,'Cortado perfectamente equilibrado','El cortado que pedí estaba perfectamente equilibrado entre el espresso y la leche vaporizada. La proporción exacta y la temperatura ideal. Volveré por este café sin duda.'],
    [5,5,4,'Ensalada fresca y abundante','La ensalada griega llegó fresca, con ingredientes de calidad y una porción más que generosa. El aderezo de aceite de oliva y limón era el complemento perfecto para el día.'],
    [4,4,5,'Wraps de pollo con buen sabor','Los wraps de pollo a la plancha son mi opción favorita para comer algo ligero y rico. Siempre frescos, bien sazonados y a un precio muy accesible para el campus universitario.'],
    [5,4,4,'Atención personalizada al cliente','El nivel de atención que recibí fue excepcional. Me recordaron mi nombre y mi orden habitual desde la segunda visita. Ese detalle hace toda la diferencia en la experiencia.'],
    [4,5,4,'Té negro perfectamente infusionado','Para alguien que no toma café, encontrar un lugar con buen té es difícil. Cuckoo Coffee tiene una selección excelente de tés y el personal sabe los tiempos correctos de infusión.'],
    [5,4,5,'Latte de vainilla excepcional','El latte de vainilla con leche de avena fue una experiencia completamente nueva. El balance entre el espresso y la vainilla es perfecto. Ya es mi bebida favorita del campus.'],
    [4,4,4,'Postre para compartir con amigos','Vinimos en grupo y pedimos varias opciones para compartir. Todo llegó fresco, bien presentado y el personal fue muy atento con nosotros durante toda la reunión académica.'],
    // NEUTRAS
    [3,4,3,'Café aceptable pero caro para el precio','El café estuvo aceptable pero no extraordinario para el precio cobrado. El ambiente es agradable para estudiar aunque a veces está muy lleno y es difícil encontrar una mesa disponible.'],
    [4,3,3,'Bueno en café malo en coordinación','La comida del menú ejecutivo estuvo bien pero tardó bastante. El café sí estuvo bueno, el problema fue la coordinación entre caja y cocina que necesita mejorar bastante.'],
    [3,3,3,'Correcto sin destacar en nada','Pedí el sandwich club y estaba correcto, nada especial. El café americano también cumplió su función. El lugar es cómodo pero los precios podrían ser más accesibles para todos.'],
    [3,4,3,'Cómodo para estudiar sin más','El lugar es cómodo y el wifi funciona bien para estudiar. La comida es regular, no destaca especialmente pero tampoco decepciona mucho. El servicio fue atento y sin demoras.'],
    [4,3,4,'Capuchino tibio por un lado','El capuchino de la tarde estaba bien aunque un poco frío para mi gusto personal. La rebanada de pastel de zanahoria estuvo sabrosa. Buen lugar para una pausa relajada.'],
    [3,3,3,'Ambiente agradable comida regular','Ambiente agradable pero la comida no cumplió las expectativas generadas. El sandwich llegó sin uno de los ingredientes y el café estaba apenas tibio. Podría mejorar bastante.'],
    [4,3,3,'Opción más cara del campus','Es la opción más cara del campus pero cuando quieres calidad superior en el café merece la pena. La comida es regular para el precio pero el café es lo que realmente destaca.'],
    [3,4,4,'Sesión de estudio cómoda','Para estudiar es un ambiente perfecto pero como restaurante propiamente es solo regular. La comida podría ser más elaborada para los precios que manejan actualmente en el menú.'],
    [4,3,3,'Muffin bueno café flojo','El muffin de arándanos estaba delicioso pero el café que lo acompañó fue bastante flojo y sin cuerpo. Para ser una cafetería especializada esperaba mucho más en cada taza.'],
    // NEGATIVAS
    [2,2,2,'Café frío en cafetería especializada','El café llegó frío y cuando lo pedí de nuevo tardaron diez minutos más. Para ser una cafetería especializada en café esperaba mucho mejor preparación y temperatura adecuada.'],
    [3,1,2,'Servicio pésimo sin acercarse','El servicio fue pésimo, nadie se acercó a atender la mesa durante quince minutos. Tuve que ir a la caja a pedir yo mismo la orden. La comida estuvo solo regular nomás.'],
    [2,2,1,'Americano aguado con café malo','Los precios son muy elevados para la calidad que ofrecen. Pagué ochenta pesos por un americano aguado que claramente estaba hecho con café de mala calidad y mal extraído.'],
    [1,3,2,'Pasta insípida sin posibilidad de cambio','La pasta llegó fría y sin sal, completamente insípida. Le pedí al mesero que la cambiara y me dijo que era imposible realizar el cambio. Nunca esperaría esto de un lugar así.'],
    [2,2,2,'Frappuccino artificial y galleta rancia','El frappuccino tenía sabor artificial y demasiado dulce. La galleta que pedí estaba rancia y sin frescura. Para lo que cobran esperaba productos frescos y de buena calidad real.'],
    [3,1,2,'Ignorado veinte minutos mientras otros','Me ignoraron durante veinte minutos mientras otras mesas recibían su pedido antes que yo. Cuando reclamé fueron groseros. La bebida estuvo apenas regular para el precio pagado.'],
    [2,2,1,'Absolutamente caro para tan poco','Absolutamente caro para la calidad recibida. El sandwich de pavo estaba seco, el pan duro y el café sin sabor. No justifica en absoluto los precios que manejan en este lugar.'],
    [1,2,2,'Café sin cuerpo ni aroma','El café americano sabía a agua caliente con colorante, sin cuerpo ni aroma. Para llamarse cafetería especializada debería invertir en mejores granos y técnica de preparación.'],
    [2,3,2,'Pasta carbonara con salsa cortada','La pasta carbonara llegó con la salsa cortada y fría. Le avisé al mesero y solo se encogió de hombros sin ofrecer solución. Experiencia muy desagradable que no repetiría jamás.'],
    [3,1,2,'Treinta minutos por café y sandwich','El tiempo de espera fue absurdo, tardaron treinta minutos en traer un café y un sandwich cuando el local no estaba lleno. No hay justificación para esa demora tan grande.'],
    [2,2,2,'Mesas sucias en la cafetería cara','El ambiente se deterioró mucho, las mesas estaban sucias y el piso también. Para ser la cafetería más cara del campus debería tener mejores estándares básicos de limpieza.'],
    [1,2,2,'Decepcionante para ser cafetería','Vine con altas expectativas por las recomendaciones y salí completamente decepcionado. El café estaba mal preparado y el personal claramente no conoce los estándares del café.'],
    [2,1,3,'Personal sin capacitación en servicio','El personal necesita capacitación urgente en atención al cliente. Fueron indiferentes, tardaron mucho y cuando les pregunté sobre el menú dieron respuestas incorrectas e imprecisas.'],
    [3,2,1,'No justifica los precios premium','Para los precios premium que cobra Cuckoo Coffee la experiencia debería ser consistentemente excelente. Por desgracia no fue así y salí sintiéndome estafado completamente.'],
  ],

  // ── Cuckoo Box ───────────────────────────────────────────────────────────────
  cuckooBox: [
    // POSITIVAS
    [5,4,5,'Box de pollo BBQ favorito del campus','El box de pollo BBQ es mi favorito del campus, muy abundante y con las papas perfectamente crujientes. Excelente relación precio-calidad que no encuentro en ningún otro lugar.'],
    [4,5,4,'Nuggets con ranch deliciosos','Pedí el box de nuggets con salsa ranch y estuvo delicioso. El personal fue muy amable y rápido, me atendieron en menos de cinco minutos a pesar de la fila existente.'],
    [5,4,4,'Alitas con marinado perfecto','Las alitas de la semana son increíbles, con el marinado perfecto y una cobertura crujiente. El box completo con papas y refresco es muy conveniente para comer entre clases.'],
    [4,4,5,'Papas gajo crujientes insuperables','Por el precio obtienes una porción generosa y de buena calidad. Las papas gajo son las mejores del campus, bien condimentadas y siempre crujientes sin importar el horario.'],
    [5,5,4,'Servicio rápido con personal amable','Muy buen servicio, el personal siempre está de buen humor y la comida llega rápido. El box especial del viernes vale completamente la pena por la cantidad que dan servido.'],
    [4,4,4,'Combo de pollo frito con coleslaw','El combo de pollo frito con ensalada coleslaw estuvo muy bueno, la carne jugosa y bien condimentada. Los precios son accesibles para el nivel de calidad que manejan siempre.'],
    [5,3,5,'Siempre fresco y caliente','La comida en Cuckoo Box siempre está fresca y caliente, nunca me han fallado en ese aspecto importante. Las papas crujientes y el pollo jugoso hacen la combinación perfecta.'],
    [4,5,4,'El más rápido del campus','El servicio de Cuckoo Box es el más rápido del campus, ideal para cuando tienes solo veinte minutos de descanso disponibles. La calidad es consistente y los precios razonables.'],
    [5,4,4,'Pollo crujiente perfectamente frito','El pollo crujiente tiene el rebozado perfecto, crocante por fuera y jugoso por dentro. Cada mordida es satisfactoria y el sabor de las especias es exactamente el apropiado.'],
    [4,4,5,'Mejor relación costo-beneficio','En términos de relación costo-beneficio, Cuckoo Box es imbatible en el campus. Mucha comida por poco dinero y la calidad se mantiene consistente en cada visita que hago.'],
    [5,4,4,'Salsas variadas y sabrosas','La variedad de salsas que ofrecen marca una gran diferencia. La BBQ es adictiva y la picante tiene el nivel perfecto de calor. Hacen que cada box sea una experiencia única.'],
    [4,5,4,'Atención rápida sin equivocaciones','El equipo de Cuckoo Box trabaja de manera muy eficiente. Nunca me han equivocado una orden y siempre tienen actitud amable y positiva. Eso hace que quiera volver siempre.'],
    [5,4,5,'Box completo que llena bien','El box completo con pollo, papas, refresco y ensalada te deja satisfecho por varias horas. Una comida completa por un precio muy accesible para cualquier estudiante universitario.'],
    [4,4,4,'Papas perfectas con cheddar','Las papas con queso cheddar fundido son simplemente perfectas. La combinación de lo crujiente de la papa con el cremoso del queso es exactamente lo que necesito entre clases.'],
    [5,5,4,'Consistencia que genera fidelidad','Lo que más valoro de Cuckoo Box es la consistencia. Cada vez que vengo sé exactamente qué esperar y siempre cumple. Esa predictibilidad de calidad genera fidelidad total.'],
    [4,4,4,'Ideal para grupo de amigos','Vinimos varios amigos y pedimos varias opciones del menú. Todo llegó fresco, caliente y a tiempo. El precio por persona fue muy razonable para lo que comimos en grupo.'],
    [5,4,4,'Nuggets crujientes con sabor propio','Los nuggets de Cuckoo Box tienen un sabor y una textura que los distinguen de cualquier otra cadena. Son crujientes por fuera, jugosos por dentro y bien sazonados siempre.'],
    [4,5,5,'Experiencia rápida y satisfactoria','Para una comida rápida, nutritiva y sabrosa entre clase y clase no existe mejor opción en el campus. Cuckoo Box cumple perfectamente con lo que promete cada vez que vengo.'],
    // NEUTRAS
    [3,3,3,'Papas blandas y pollo correcto','Las papas estaban bien aunque un poco blandas para mi gusto. El pollo estuvo correcto pero nada extraordinario. El servicio fue normal y la espera razonable para la hora.'],
    [3,4,3,'Box básico aceptable con altibajos','Pedí el box básico y estuvo aceptable, aunque las papas llegaron frías esta vez. El personal fue amable pero la comida en sí no fue tan buena como en otras visitas anteriores.'],
    [4,3,3,'Bien condimentado pero porción pequeña','El pollo estuvo bien condimentado pero la porción me pareció un poco pequeña para el precio cobrado. El servicio fue correcto aunque la caja tardó en procesar el pago.'],
    [3,3,4,'Fast food que cumple su función','Comida de fast food correcta, cumple su función cuando tienes prisa. Los precios son razonables pero la calidad es inconsistente dependiendo del día y del horario de visita.'],
    [3,4,3,'Nuggets fríos en visita regular','El box de nuggets estaba bien aunque llegaron un poco fríos en esta visita. El mesero fue atento pero la cocina tardó más de lo usual para ser un lugar de comida rápida.'],
    [4,3,3,'Papas buenas pollo con exceso de aceite','Las papas gajo estuvieron bien pero el pollo tenía demasiado aceite. La porción fue suficiente y el precio razonable. Nada especial pero tampoco decepcionante en general.'],
    [3,3,3,'Regular en términos generales','La calidad ha ido variando con el tiempo. Algunas visitas son muy buenas y otras son bastante regulares. Sería ideal que mantuvieran estándares más consistentes en la preparación.'],
    [4,3,4,'Rápido pero inconsistente','Lo que salva a Cuckoo Box es la velocidad del servicio. Para cuando tienes poco tiempo es la mejor opción aunque la calidad no siempre está al nivel que uno esperaría encontrar.'],
    [3,4,3,'Box decente sin entusiasmar','El box de pollo fue decente sin entusiasmarme especialmente. El personal fue amable y el tiempo de espera razonable. Una opción válida cuando no quieres arriesgarte con otras.'],
    // NEGATIVAS
    [1,2,2,'Pollo crudo devuelto sin disculpa','El pollo llegó completamente crudo por dentro, tuve que devolverlo. El encargado no se disculpó ni me ofreció compensación alguna. Es un riesgo real para la salud estudiantil.'],
    [2,1,2,'Veinticinco minutos por box simple','Esperé veinticinco minutos por un box simple y cuando llegó estaba frío y grasoso. El personal fue grosero cuando pregunté por mi pedido con total naturalidad y educación.'],
    [2,2,1,'No justifica los precios actuales','Por esos precios esperaba más calidad. Las papas estaban blandas y frías, el pollo seco y sin sabor. Definitivamente no vale lo que cobran actualmente en este establecimiento.'],
    [1,3,2,'Pollo rancio recalentado del día anterior','El pollo frito estaba rancio, claramente de días anteriores recalentado. El aceite olía mal y la carne tenía una textura horrible. Reporté el problema sin recibir ninguna respuesta.'],
    [2,2,2,'Frío a pesar de local vacío','La comida llegó fría a pesar de que el lugar estaba casi vacío ese momento. Las papas blandas y el pollo sin sazón. Para comida rápida esperaba al menos que llegara caliente.'],
    [3,1,2,'Personal grosero con tiempos absurdos','El personal fue muy grosero y tardaron mucho tiempo en atender la caja. Cuando llegó la comida estaba tibia y las papas blandas. Pésimo servicio para comida rápida de campus.'],
    [2,2,1,'Precio sube calidad baja cada semana','Precios que suben cada semana mientras la calidad baja notablemente. El box que antes tenía buena porción ahora viene con muy poco pollo y papas de calidad inferior a la usual.'],
    [1,2,2,'Aceite rancio que causó malestar','El aceite de la fritura estaba claramente reutilizado muchas veces, la comida tenía un sabor rancio horrible. Me causó malestar estomacal el resto completo del día de clases.'],
    [2,3,2,'Papas crudas por dentro quemadas fuera','Las papas gajo llegaron crudas por dentro y quemadas por fuera. El pollo estaba aceptable pero la mala experiencia con las papas arruinó el pedido completamente esa tarde.'],
    [3,1,1,'Caro, malo y orden equivocada','Muy caro para comida de baja calidad. El servicio además fue pésimo, me dieron el pedido equivocado y no quisieron hacer el cambio correspondiente. Pérdida de tiempo y dinero.'],
    [2,2,2,'Calidad ha bajado notablemente','La comida de Cuckoo Box ha bajado notablemente de calidad últimamente. Antes era mi lugar favorito pero ahora el pollo siempre llega seco y las papas frías sin condimento.'],
    [1,2,2,'Experiencia que no recomendaría','Una experiencia que no le recomendaría a nadie. La comida estaba mal preparada, el servicio fue indiferente y el precio no justifica en absoluto lo que recibes por tu dinero.'],
    [2,1,3,'Orden incorrecta sin actitud de ayuda','Me equivocaron la orden dos veces seguidas. Cuando reclamé la segunda vez el encargado se molestó en lugar de disculparse. Esa actitud no debería existir en ningún negocio del campus.'],
    [3,2,1,'Inconsistencia total en la calidad','La inconsistencia de Cuckoo Box es su mayor problema. Un día puede ser excelente y al siguiente es francamente malo. No se puede confiar en una experiencia consistentemente buena.'],
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────
async function registerOrLogin({ name, email, password, carrera }) {
  // Intentar registro
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, carrera }),
  });
  const regJson = await regRes.json();
  if (regJson.success) return regJson.data.token;

  // Si ya existe (409) → login
  if (regRes.status === 409) {
    const logRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const logJson = await logRes.json();
    if (logJson.success) return logJson.data.token;
    throw new Error(`Login failed for ${email}: ${JSON.stringify(logJson)}`);
  }

  throw new Error(`Register failed for ${email}: ${JSON.stringify(regJson)}`);
}

async function createReview(token, establishmentId, food, service, price, title, comment) {
  const res = await fetch(`${BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ establishmentId, foodScore: food, serviceScore: service, priceScore: price, title, comment }),
  });
  return res.json();
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🌱 Seed UAO-Eats — ${USERS.length} usuarios × ${ESTABLISHMENTS.length} establecimientos`);
  console.log(`   Total esperado: ${USERS.length * ESTABLISHMENTS.length} reseñas\n`);

  let totalOk = 0, totalFail = 0;

  for (let i = 0; i < USERS.length; i++) {
    const user = USERS[i];
    let token;

    try {
      token = await registerOrLogin(user);
    } catch (err) {
      console.error(`  ✗ Auth falló para ${user.email}: ${err.message}`);
      totalFail += ESTABLISHMENTS.length;
      continue;
    }

    // Cada usuario reseña los 4 establecimientos
    for (const est of ESTABLISHMENTS) {
      const pool = POOLS[est.key];
      const [food, service, price, title, comment] = pool[i % pool.length];

      const result = await createReview(token, est.id, food, service, price, title, comment);

      if (result.success) {
        console.log(`  ✓ [u${String(i+1).padStart(3,'0')}] [${est.label.padEnd(13)}] ${food}★/${service}★/${price}★ — ${title}`);
        totalOk++;
      } else {
        const msg = result.message || result.error || JSON.stringify(result);
        console.warn(`  ✗ [u${String(i+1).padStart(3,'0')}] [${est.label.padEnd(13)}] ${msg}`);
        totalFail++;
      }

      await sleep(80);
    }

    // Pausa entre usuarios para no saturar argon2 en registro
    await sleep(150);
  }

  console.log(`\n✅ Completado: ${totalOk} creadas, ${totalFail} fallidas de ${USERS.length * ESTABLISHMENTS.length} total.`);
  console.log('Siguiente paso: POST /api/metrics/run (admin) para procesar el pipeline de analytics.\n');
}

main().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});

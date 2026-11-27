/**
 * Lines of the "División Hospitalaria" panel, taken from slides 6–11 of the company catalog
 * ("Catálogo virtual MEDSUPPLIES & INGENIERÍA"). Wording follows the catalog, converted from
 * uppercase to sentence case; comma-separated entries are split into one chip each.
 *
 * Photos: the blue-and-white catalog images from `npm run images:prepare`, all lines together in
 * tab order, shown as one loop for the whole division.
 */
import anesthesia01 from '../../assets/images/products/hospital/anesthesia/01.webp';
import anesthesia02 from '../../assets/images/products/hospital/anesthesia/02.webp';
import dentistry01 from '../../assets/images/products/hospital/dentistry/01.webp';
import dentistry02 from '../../assets/images/products/hospital/dentistry/02.webp';
import dentistry03 from '../../assets/images/products/hospital/dentistry/03.webp';
import dentistry04 from '../../assets/images/products/hospital/dentistry/04.webp';
import drainage01 from '../../assets/images/products/hospital/drainage/01.webp';
import drainage02 from '../../assets/images/products/hospital/drainage/02.webp';
import dressings01 from '../../assets/images/products/hospital/dressings/01.webp';
import dressings02 from '../../assets/images/products/hospital/dressings/02.webp';
import gynecology01 from '../../assets/images/products/hospital/gynecology/01.webp';
import infusion01 from '../../assets/images/products/hospital/infusion/01.webp';
import infusion02 from '../../assets/images/products/hospital/infusion/02.webp';
import injection01 from '../../assets/images/products/hospital/injection/01.webp';
import injection02 from '../../assets/images/products/hospital/injection/02.webp';
import injection03 from '../../assets/images/products/hospital/injection/03.webp';
import injection04 from '../../assets/images/products/hospital/injection/04.webp';
import laboratory01 from '../../assets/images/products/hospital/laboratory/01.webp';
import laboratory02 from '../../assets/images/products/hospital/laboratory/02.webp';
import laboratory03 from '../../assets/images/products/hospital/laboratory/03.webp';
import laboratory04 from '../../assets/images/products/hospital/laboratory/04.webp';
import monitoring01 from '../../assets/images/products/hospital/monitoring/01.webp';
import monitoring02 from '../../assets/images/products/hospital/monitoring/02.webp';
import protection01 from '../../assets/images/products/hospital/protection/01.webp';
import protection02 from '../../assets/images/products/hospital/protection/02.webp';
import protection03 from '../../assets/images/products/hospital/protection/03.webp';
import protection04 from '../../assets/images/products/hospital/protection/04.webp';
import respiratory01 from '../../assets/images/products/hospital/respiratory/01.webp';
import respiratory02 from '../../assets/images/products/hospital/respiratory/02.webp';
import respiratory03 from '../../assets/images/products/hospital/respiratory/03.webp';
import type { DivisionPanel } from './siteData';

export const HOSPITAL_PANEL: DivisionPanel = {
  lines: [
    {
      id: 'infusion',
      kind: 'products',
      tabLabel: 'Infusión',
      title: 'Línea de infusión',
      items: [
        'Equipo macro y microgoteo',
        'Equipo de administración de sangre',
        'Equipo pericraneal',
        'Equipo en Y',
        'Extensiones',
        'Conector libre de aguja',
        'Llave de 3 vías',
        'Buretrol',
        'Equipo Medifix',
      ],
    },
    {
      id: 'respiratory',
      kind: 'products',
      tabLabel: 'Respiratoria',
      title: 'Línea respiratoria',
      items: [
        'Cánulas',
        'Humidificador de oxígeno',
        'Extensión de oxígeno',
        'Inhalocámara',
        'Máscaras',
        'Filtros antimicrobianos',
        'Nariz de camello',
        'Incentivo respiratorio',
        'Micronebulizadores',
        'Kit Venturi',
        'Resucitadores manuales',
      ],
    },
    {
      id: 'anesthesia',
      kind: 'products',
      tabLabel: 'Anestesia',
      title: 'Línea de anestesia',
      items: [
        'Circuitos',
        'Balones',
        'Máscaras',
        'Tubos endotraqueales',
        'Cánulas de Guedel',
        'Spinocan',
      ],
    },
    {
      id: 'gynecology',
      kind: 'products',
      tabLabel: 'Ginecología',
      title: 'Línea de ginecología',
      items: ['Espéculo vaginal desechable', 'Kit citológico desechable'],
    },
    {
      id: 'monitoring',
      kind: 'products',
      tabLabel: 'Monitoreo',
      title: 'Línea de monitoreo',
      items: ['Electrodos', 'Lápiz y placa de electrobisturí', 'Kits de monitoreo'],
    },
    {
      id: 'dressings',
      kind: 'products',
      tabLabel: 'Gasas y apósitos',
      title: 'Línea de gasas, compresas, vendas, cintas, apósitos y esparadrapos',
      items: ['Gasas', 'Compresas', 'Vendas', 'Cintas', 'Apósitos', 'Esparadrapos'],
    },
    {
      id: 'drainage',
      kind: 'products',
      tabLabel: 'Drenaje y recolección',
      title: 'Línea de drenaje y recolección',
      items: [
        // Kept whole: "en comodato" may apply to every item or only to the equipment.
        'Bolsas, sistemas y equipos de succión y recolección en comodato',
        'Sondas Foley',
        'Sondas Nelatón',
        'Mangueras y catéter de succión',
      ],
    },
    {
      id: 'injection',
      kind: 'products',
      tabLabel: 'Inyección y catéteres',
      title: 'Guantes, jeringas, agujas y catéter',
      items: ['Guantes', 'Jeringas', 'Agujas', 'Catéter'],
    },
    {
      id: 'protection',
      kind: 'products',
      tabLabel: 'Protección',
      title: 'Línea de protección',
      items: ['Gafas', 'Caretas', 'Ropa y paquetes quirúrgicos', 'Tapabocas', 'Termómetros'],
    },
    {
      id: 'laboratory',
      kind: 'products',
      tabLabel: 'Laboratorio y esterilización',
      title: 'Línea de laboratorio, desinfección y esterilización',
      items: [
        'Indicadores biológicos',
        'Indicadores químicos',
        'Papel crepado',
        'Bolsas',
        'Cintas de control químico',
        'Tiras indicadoras',
        'Tubos para laboratorio',
        'Aguja múltiple',
        'Pipetas',
        'Caja de Petri',
        'Envases para recolección de orina',
        'Envases para muestra coprológica',
        'Envases multimuestra',
        'Envases para orina de 24 horas',
        'Recolector de objetos cortopunzantes',
        'Desinfectantes de superficies',
      ],
    },
    {
      id: 'cleaning',
      kind: 'products',
      tabLabel: 'Limpieza',
      title: 'Línea de limpieza',
      items: [
        'Aplicadores de algodón',
        'Bajalenguas',
        'Toallas impregnadas con alcohol isopropílico o clorhexidina',
        'Condones',
      ],
    },
    {
      id: 'dentistry',
      kind: 'products',
      tabLabel: 'Odontología',
      title: 'Línea de odontología',
      items: [
        'Cajas retenedoras',
        'Cubetas de impresión',
        'Separadores bucales',
        'Caretas protectoras',
      ],
    },
  ],
  images: [
    infusion01,
    infusion02,
    respiratory01,
    respiratory02,
    respiratory03,
    anesthesia01,
    anesthesia02,
    gynecology01,
    monitoring01,
    monitoring02,
    dressings01,
    dressings02,
    drainage01,
    drainage02,
    injection01,
    injection02,
    injection03,
    injection04,
    protection01,
    protection02,
    protection03,
    protection04,
    laboratory01,
    laboratory02,
    laboratory03,
    laboratory04,
    dentistry01,
    dentistry02,
    dentistry03,
    dentistry04,
  ],
};

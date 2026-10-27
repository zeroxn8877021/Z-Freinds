export const COUNTRIES = [
  ['IN','India'],['US','United States'],['KR','South Korea'],['JP','Japan'],['CN','China'],['PK','Pakistan'],['BD','Bangladesh'],
  ['NP','Nepal'],['LK','Sri Lanka'],['ID','Indonesia'],['PH','Philippines'],['VN','Vietnam'],['TH','Thailand'],['MY','Malaysia'],
  ['SG','Singapore'],['AE','United Arab Emirates'],['SA','Saudi Arabia'],['IQ','Iraq'],['EG','Egypt'],['NG','Nigeria'],
  ['ZA','South Africa'],['KE','Kenya'],['TR','Turkey'],['RU','Russia'],['DE','Germany'],['FR','France'],['GB','United Kingdom'],
  ['IT','Italy'],['ES','Spain'],['PT','Portugal'],['BR','Brazil'],['MX','Mexico'],['AR','Argentina'],['CO','Colombia'],
  ['CA','Canada'],['AU','Australia'],['NZ','New Zealand'],['PL','Poland'],['UA','Ukraine'],['NL','Netherlands'],
];
export const LANGUAGES = ['English','Hindi','Korean','Japanese','Chinese','Arabic','Spanish','French','German','Portuguese','Russian','Turkish','Tagalog','Indonesian','Bengali','Urdu','Tamil','Malayalam','Telugu'];
export const TOPICS = ['Daily life','Hobbies','Travel','Make friends',"Let's talk",'Questions','Tell me'];
export const countryName = (code) => (COUNTRIES.find((c) => c[0] === code) || [code, code || ''])[1];
export const flag = (code) =>
  code && code.length === 2 ? String.fromCodePoint(...code.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0))) : '🌐';

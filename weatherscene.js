/* Original pixel landscape. Pure SVG, with no images, fonts or network requests. */
window.WeatherScene = function WeatherScene(kind = 'clear', isDay = true) {
  const wet = kind === 'rain' || kind === 'storm';
  const snow = kind === 'snow';
  const fog = kind === 'fog';
  const overcast = wet || snow || fog || kind === 'cloudy';
  // Daylight is intentionally a separate, bright landscape. The hero's text
  // overlay is owned by the surrounding UI, so the scene keeps its blue sky.
  const day = { sky: '#7db9df', band: '#9ac9de', haze: '#accdd5', mountain: '#7a99ac', ridge: '#c7d6d9', mountainFront: '#698c96', hill: '#6c9472', forest: '#447b63', tree: '#285c4d', treeLight: '#73996f', ground: '#507b5a', lake: '#509eae', glint: '#b2dde0', cloud: '#eff4ec', orb: '#f7da7b', light: '#a5c9d9', cabin: '#c4aa7c', roof: '#765647' };
  const dayWeather = {
    cloudy: { sky: '#9cbbcf', band: '#b0cbd8', haze: '#b6cdd2', mountain: '#8a9fac', ridge: '#c9d7d8', mountainFront: '#738f98', hill: '#799780', forest: '#547e69', tree: '#356451', treeLight: '#81a085', ground: '#638365', lake: '#659da9', cloud: '#e2ecee', light: '#acc4d0' },
    rain: { sky: '#89a8ba', band: '#a1bac6', haze: '#a5bec8', mountain: '#7c96a3', ridge: '#b4c8cf', mountainFront: '#698690', hill: '#638575', forest: '#486f60', tree: '#305b50', treeLight: '#70927b', ground: '#55755f', lake: '#567f92', glint: '#abc9d5', cloud: '#c5d6dc', light: '#92b1c2', cabin: '#af9d7f', roof: '#665b51' },
    snow: { sky: '#9dbdcd', band: '#b8ced9', haze: '#c5d7db', mountain: '#8ca2af', ridge: '#e5eeed', mountainFront: '#8da7b1', hill: '#a6bba8', forest: '#738d7d', tree: '#3d6b5b', treeLight: '#9db4a4', ground: '#b8c9ba', lake: '#729dac', glint: '#dbe9eb', cloud: '#e9efed', light: '#abc5cf', cabin: '#c5b298', roof: '#6c7377' },
    storm: { sky: '#647f98', band: '#839eae', haze: '#91a7b4', mountain: '#6d8296', ridge: '#a1b4c0', mountainFront: '#5a7787', hill: '#55776f', forest: '#3f6259', tree: '#2d4f49', treeLight: '#65877a', ground: '#48665b', lake: '#4e788c', glint: '#a6c4d2', cloud: '#a0b3c0', light: '#86a8bb', cabin: '#a2947d', roof: '#5b5856' },
    fog: { sky: '#b9c9cd', band: '#c4d3d5', haze: '#c0d0d0', mountain: '#a8babd', ridge: '#ccd8d7', mountainFront: '#9bafb2', hill: '#a0b3a3', forest: '#8fa797', tree: '#7a958a', treeLight: '#a8bfae', ground: '#90a793', lake: '#99b9bd', glint: '#d3e1df', cloud: '#e6eeee', light: '#c1d3d8', cabin: '#b8b8a1', roof: '#85918b' }
  };
  const p = isDay
    ? { ...day, ...(dayWeather[kind] || {}) }
    : { sky: '#181a2c', band: '#24243d', haze: '#32304b', mountain: '#403d60', ridge: '#615b7b', mountainFront: '#302e4b', hill: '#26283d', forest: '#1b2334', tree: '#141e2b', treeLight: '#2b3449', ground: '#192431', lake: '#242e45', glint: '#4b526f', cloud: '#67657f', orb: '#d3e8ad', light: '#d7e8a6', cabin: '#434356', roof: '#25273b' };
  const pine = (x, y, scale, fill = p.tree) => `<g transform="translate(${x} ${y}) scale(${scale})" fill="${fill}"><path d="M-2 0h4v7h4v7h4v7h4v7H7v5h10v7H4v14h-8V40h-13v-7h10v-5h-7v-7h4v-7h4V7h4z"/><path d="M-2 12h2v8h-4v7h-4v-3h2v-7h4z" fill="${p.treeLight}" opacity=".52"/></g>`;
  const stars = !isDay ? `<g fill="${p.orb}">${[[460,50,2],[515,91,2],[559,32,2],[608,110,2],[721,27,2],[748,92,2],[781,53,2],[541,136,2],[471,156,1],[710,155,2],[757,181,1],[597,46,1]].map(([x,y,s],i)=>`<rect class="scene-star" x="${x}" y="${y}" width="${s}" height="${s}" opacity="${i % 3 ? '.35' : '.7'}" style="--delay:${i * .53}s"/>`).join('')}<path class="scene-star" d="M586 79h2v4h4v2h-4v4h-2v-4h-4v-2h4z" opacity=".6"/><path class="scene-star" d="M751 124h2v3h3v2h-3v3h-2v-3h-3v-2h3z" opacity=".45" style="--delay:2s"/></g>` : '';
  const orb = isDay
    ? `<g opacity="${kind === 'storm' ? '.08' : wet || fog || snow ? '.2' : overcast ? '.45' : '1'}"><path d="M646 43h28v5h10v10h5v28h-5v10h-10v5h-28v-5h-10V86h-5V58h5V48h10z" fill="${p.orb}"/><path d="M641 82h5v9h28v-5h10v5h-5v5h-34v-5h-4z" fill="#cbbb7e"/><path d="M643 55h6v-5h15v3h-12v5h-9z" fill="#faf0c0" opacity=".65"/></g>`
    : `<g opacity="${overcast ? '.46' : '.95'}"><path d="M646 43h26v5h10v10h5v26h-5v10h-10v5h-26v-5h-10V84h-5V58h5V48h10z" fill="${p.orb}"/><path d="M664 43h13v5h10v10h5v29h-8v5h-14v-5h-10V77h-5V56h4v-8h5z" fill="${p.sky}"/><path d="M641 65h5v5h-5zm7 20h4v4h-4zm-9-5h3v3h-3z" fill="#b0c991" opacity=".65"/></g>`;
  const clouds = `<g fill="${p.cloud}"><g class="scene-cloud scene-cloud--far" opacity="${isDay ? (overcast ? '.9' : '.82') : (overcast ? '.43' : '.22')}"><path d="M522 127h12v-7h18v-9h24v7h17v9h12v10h-83z"/><path d="M539 137h55v3h-55z" opacity=".4"/></g><g class="scene-cloud" opacity="${isDay ? (overcast ? '.94' : '.9') : (overcast ? '.53' : '.27')}"><path d="M682 119h12v-8h15v-8h26v6h16v9h21v10H682z"/><path d="M701 128h48v3h-48z" opacity=".4"/></g>${overcast ? `<g class="scene-cloud scene-cloud--low" opacity="${isDay ? '.9' : '.55'}"><path d="M596 81h13v-8h20v-7h23v7h17v8h17v11h-90z"/><path d="M736 65h11v-7h22v-8h25v10h13v14h-71z"/></g>` : ''}</g>`;
  const rain = wet ? `<g fill="${isDay ? '#d5e5ee' : '#abc5dc'}" opacity="${isDay ? '.67' : '.43'}">${Array.from({length:26},(_,i)=>{const x=464+(i*43)%328;const y=121+(i*29)%138;return `<rect class="scene-rain" x="${x}" y="${y}" width="2" height="${6+i%5}" style="--delay:-${(i*.17).toFixed(2)}s"/>`;}).join('')}</g>` : '';
  const flakes = snow ? `<g fill="${isDay ? '#f4faf8' : '#d6e4e8'}" opacity="${isDay ? '.96' : '.72'}">${Array.from({length:26},(_,i)=>{const x=448+(i*47)%346;const y=95+(i*31)%176;return `<rect class="scene-snow" x="${x}" y="${y}" width="${i%3===0?3:2}" height="${i%3===0?3:2}" style="--delay:-${(i*.43).toFixed(2)}s"/>`;}).join('')}</g>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 360" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges" class="weather-scene" aria-hidden="true" focusable="false">
    <rect width="800" height="360" fill="${p.sky}"/>
    <path d="M354 211h74v-9h67v-12h75v-12h107v12h73v-8h50v178H354z" fill="${p.band}"/>
    <path d="M398 244h48v-16h29v-17h42v-12h30v-15h46v-15h53v11h25v12h53v15h34v13h42v140H398z" fill="${p.haze}"/>
    ${stars}${orb}${clouds}
    <path d="M389 284v-15h32v-15h22v-20h22v-20h19v-19h21v-19h17v-17h18v-18h20v-19h23v12h11v14h17v17h18v16h22v18h19v20h23v18h25v20h33v21h25v26z" fill="${p.mountain}"/>
    <path d="M509 177h13v-18h18v-18h20v-19h23v12h11v14h17v17h18v16h-17v-9h-21v-15h-18v12h-15v-14h-8v22h-18v17h-23z" fill="${snow ? (isDay ? '#eef4ef' : '#b2becb') : p.ridge}"/>
    <path d="M560 141h14v-19h9v12h11v14h17v17h18v16h-17v-9h-21v-15h-18v12h-13z" fill="${p.haze}" opacity=".65"/>
    <path d="M556 280v-20h26v-20h26v-17h23v-18h20v-20h20v-14h19v-17h20v15h16v15h17v17h20v17h21v16h16v126H556z" fill="${p.mountainFront}"/>
    <path d="M651 205h20v-20h20v-14h19v-17h0v15h16v15h17v17h-18v-11h-15v12h-11v-10h-9v15h-15v7h-24z" fill="${snow ? (isDay ? '#d7e6e6' : '#8d9cab') : p.mountain}"/>
    <path d="M0 330h98v-7h73v-8h53v-9h70v-8h46v-10h33v-12h36v-12h44v-12h45v8h33v12h36v12h68v-9h48v-12h53v9h32v14h32v12h52v62H0z" fill="${p.hill}"/>
    ${pine(440,235,.58,p.forest)}${pine(462,226,.72,p.forest)}${pine(482,239,.55,p.forest)}${pine(505,244,.59,p.forest)}${pine(766,209,.88,p.forest)}${pine(793,202,1.1,p.forest)}
    <path d="M379 309h52v-10h52v-9h46v-8h49v-7h57v8h38v12h51v14h76v51H0v-11h192v-10h111v-14h76z" fill="${p.forest}"/>
    <path d="M0 350h159v-8h107v-9h75v-8h46v-10h59v-8h53v6h32v9h68v9h75v8h74v8h52v13H0z" fill="${p.lake}"/>
    <path d="M478 309h35v7h35v6h64v9h48v7h60v9h80v13h-96v-9h-70v-8h-64v-9h-53v-8h-30v-8h-24v-4h-17z" fill="${p.ground}"/>
    <g class="scene-water" fill="${p.glint}" opacity=".55"><path d="M369 326h25v2h-25zm56-11h20v2h-20zm-67 26h54v2h-54zm78-15h34v2h-34zm41 18h35v2h-35zm-159 10h36v2h-36zm65-2h69v2h-69zm148 1h31v2h-31z"/></g>
    <g fill="${p.light}" opacity=".3"><rect class="scene-water" x="472" y="321" width="18" height="2"/><rect class="scene-water" x="465" y="334" width="31" height="2"/><rect class="scene-water" x="451" y="347" width="27" height="2"/></g>
    <g transform="translate(610 236)"><path d="M-8 35h104v7H-8z" fill="${p.ground}"/><path d="M12 9h56v35H12z" fill="${p.cabin}"/><path d="M5 9h13V2h12v-7h20v7h13v7h13v7H5z" fill="${p.roof}"/><path d="M7 8h11V1h12v-7h20v7h13v7h11v3H62V4H49v-7H31v7H19v7H7z" fill="${snow ? (isDay ? '#eff5ef' : '#c0c8d1') : p.ridge}"/><path d="M17 17h2v24h-2zm45 0h2v24h-2z" fill="${p.roof}" opacity=".6"/><path d="M24 19h12v11H24zm22 0h12v11H46z" fill="${p.light}"/><path d="M29 19h2v11h-2zm22 0h2v11h-2z" fill="${p.roof}" opacity=".7"/><path d="M36 34h10v10H36z" fill="${p.roof}"/><rect x="52" y="-13" width="7" height="14" fill="${p.roof}"/><path class="scene-cloud scene-cloud--smoke" d="M53-18h6v-5h-6v-6h7v-7h-4v-5h5v-4h3v7h-4v7h-3v5h5v6h-5v5h-4z" fill="${p.cloud}" opacity=".23"/></g>
    <path d="M610 280h97v4h-97zm-4 5h18v3h-18zm96 0h12v3h-12z" fill="${p.treeLight}"/>
    ${pine(586,228,1.04)}${pine(554,250,.77)}${pine(730,232,1.15)}${pine(759,258,.72)}${pine(794,226,1.45)}
    <path d="M593 322h12v-7h4v15h-16zm87 10h8v-6h3v13h-11zm-111-32h4v-7h3v14h-7z" fill="${p.treeLight}"/>
    ${wet ? `<path d="M553 313h10v2h-10zm62 13h12v2h-12zm113 11h16v2h-16z" fill="${p.glint}"/>` : ''}
    ${fog ? `<g fill="${isDay ? '#e8f0ec' : '#b6b5c5'}" opacity="${isDay ? '.38' : '.12'}"><path class="scene-cloud scene-cloud--far" d="M383 231h165v5H383zm68 20h281v7H451zm83 26h231v5H534z"/><path class="scene-cloud" d="M589 215h195v4H589zm-93 77h228v5H496z"/></g>` : ''}
    ${rain}${flakes}${kind === 'storm' ? `<path class="scene-flash" d="M715 144h-13v23h-9v12h12v22h5v-28h12v-11h-12z" fill="#dfdfa7" opacity="0"/>` : ''}
    <path d="M0 357h800v3H0z" fill="${p.sky}" opacity=".3"/>
  </svg>`;
};
# Audio Files Directory

Esta directorio contiene los archivos de audio de meditación para Sadhana Web.

## Estructura Organizada

### `bells/` - Sonidos de Campanas y Cuencos (11 archivos)

- `tibetan-bowl-resonant.mp3` - Cuenco tibetano resonante
- `tibetan-bowl-pure.mp3` - Cuenco tibetano puro  
- `tibetan-bowl-struck.mp3` - Cuenco tibetano golpeado
- `chakra-bowl.mp3` - Cuenco de chakras (7 chakras)
- `meditation-bell.mp3` - Campana de meditación clásica
- `chime-meditation.mp3` - Campanilla de meditación
- `zen-gong.mp3` - Gong zen tradicional
- `gong-deep.mp3` - Gong profundo
- `gong-bell.mp3` - Campana gong
- `singing-bell.mp3` - Campana cantante
- `japanese-temple-bell.mp3` - Campana de templo japonés

### `ambient/` - Sonidos Ambiente (15 archivos)

**Bosque y Naturaleza:**

- `forest-day.mp3` - Ambiente de bosque diurno
- `forest-night.mp3` - Paisaje sonoro nocturno del bosque
- `forest-windy-night.mp3` - Bosque ventoso nocturno
- `forest-rain-birds.mp3` - Lluvia en el bosque con pájaros

**Lluvia y Agua:**

- `rain-thunder.mp3` - Lluvia con truenos
- `rain-thunder-long.mp3` - Lluvia prolongada (10 minutos)
- `rain-distant-thunder.mp3` - Lluvia con truenos distantes
- `river-flowing.mp3` - Río fluyendo
- `river-gentle.mp3` - Sonidos suaves de río

**Insectos y Vida:**

- `cicadas-evening.mp3` - Cigarras del atardecer
- `cicadas-buzzing.mp3` - Zumbido intenso de cigarras
- `crickets-gentle.mp3` - Grillos suaves
- `crickets-summer-night.mp3` - Grillos en noche de verano

**Otros:**

- `wind-gentle.mp3` - Viento suave
- `cathedral-ambience.mp3` - Ambiente de catedral

### `fx/` - Efectos Sonoros (4 archivos)

- `chimes-light.mp3` - Campanillas ligeras
- `chimes-small.mp3` - Campanillas pequeñas
- `chimes-medium.mp3` - Campanillas medianas
- `chimes-wooden.mp3` - Campanillas de madera

## Especificaciones Técnicas

- **Formato**: MP3 (compatibilidad universal)
- **Bitrate**: 128-192 kbps (equilibrio calidad/tamaño)
- **Duración**:
  - Campanas: 3-15 segundos
  - Ambiente: 5-10 minutos (loop perfecto)
  - Efectos: 2-8 segundos
- **Volumen**: Normalizado, niveles consistentes
- **Canales**: Estéreo para ambiente, mono/estéreo para campanas

## Uso en la Aplicación

Currently these are placeholder files. For production:

1. Replace with actual high-quality meditation audio
2. Ensure files are properly licensed for use
3. Consider using Web Audio format (.wav) for bells for better quality
4. Optimize file sizes for web delivery
5. Add proper metadata tags

## Fallback Behavior

The AudioManager includes graceful fallback:

- If audio files are missing, silent buffers are used
- App continues to function without audio
- User is notified of audio issues via UI

## Recommended Sources

- **Free**: Freesound.org, YouTube Audio Library
- **Record your own**: Using singing bowls, nature recordings

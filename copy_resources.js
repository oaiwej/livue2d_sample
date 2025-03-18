import fs from 'fs'

const publicResources = [
  { src: './CubismSdkForWeb/Core', dst: './public/Core' },
  { src: './CubismSdkForWeb/Samples/Resources', dst: './public/Resources' },
]

publicResources.forEach((e) => {
  if (fs.existsSync(e.dst)) fs.rmSync(e.dst, { recursive: true })
})
publicResources.forEach((e) => fs.cpSync(e.src, e.dst, { recursive: true }))

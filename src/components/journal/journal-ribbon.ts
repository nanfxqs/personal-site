import {
  Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial,
  SRGBColorSpace, TextureLoader, Vector2, Vector4, WebGLRenderer,
} from 'three';

const vertexShader = `
  uniform vec2 viewport;
  uniform vec2 pointer;
  uniform vec4 rect;
  uniform float speed;
  varying vec2 coverUv;
  varying float light;

  void main() {
    coverUv = uv;
    vec2 pixel = rect.xy + vec2(uv.x, 1.0 - uv.y) * rect.zw;
    float across = (pixel.x / viewport.x - 0.5) * 2.0;
    float phase = across * 1.07 - 0.17;
    float taper = exp(-phase * phase);
    float profile = sin(phase * 3.14159) * taper;
    float slope = (3.14159 * cos(phase * 3.14159) - 2.0 * phase * sin(phase * 3.14159)) * taper;
    float bulge = exp(-dot((pixel - pointer) / 200.0, (pixel - pointer) / 200.0));
    float roll = slope * 0.047 + speed * across * taper * 0.19;
    float heightFromCenter = pixel.y - (rect.y + rect.w * 0.5);
    float depth = -profile * (0.23 + abs(speed) * 0.16) - across / (1.0 + abs(across)) * 0.13
      + sin(roll) * heightFromCenter / viewport.y + bulge * 0.024;
    pixel.y += profile * rect.w * 0.042 + heightFromCenter * (cos(roll) - 1.0);
    vec2 center = vec2(viewport.x * 0.5, viewport.y * 0.53);
    pixel = center + (pixel - center) / (1.0 - depth);
    light = 0.89 + slope * 0.037 + bulge * 0.045;
    gl_Position = vec4(pixel.x / viewport.x * 2.0 - 1.0, 1.0 - pixel.y / viewport.y * 2.0, -depth, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D image;
  uniform vec4 rect;
  uniform float aspect;
  varying vec2 coverUv;
  varying float light;

  void main() {
    vec2 pixel = coverUv * rect.zw;
    vec2 edge = abs(pixel - rect.zw * 0.5) - rect.zw * 0.5 + 10.0;
    float corner = length(max(edge, 0.0)) - 10.0;
    float opacity = 1.0 - smoothstep(-1.1, 0.5, corner);
    if (opacity < 0.01) discard;
    float ratio = rect.z / rect.w;
    vec2 crop = vec2(min(1.0, ratio / aspect), min(1.0, aspect / ratio));
    vec3 color = texture2D(image, (coverUv - 0.5) * crop + 0.5).rgb;
    gl_FragColor = vec4(color * light, opacity);
    #include <colorspace_fragment>
  }
`;

export async function createJournalRibbon(stage: HTMLElement, images: string[]) {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ alpha: true, antialias: true });
  } catch {
    return null;
  }

  const loader = new TextureLoader();
  const sources = [...new Set(images)];
  const loaded = await Promise.allSettled(sources.map((source) => loader.loadAsync(source)));
  if (loaded.some((result) => result.status === 'rejected')) {
    for (const result of loaded) if (result.status === 'fulfilled') result.value.dispose();
    renderer.dispose();
    return null;
  }
  const textures = loaded.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
  for (const texture of textures) texture.colorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new OrthographicCamera();
  const geometry = new PlaneGeometry(1, 1, 40, 16);
  const viewport = new Vector2();
  const pointer = new Vector2(-1000, -1000);
  const meshes = images.map((source) => {
    const texture = textures[sources.indexOf(source)];
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        viewport: { value: viewport },
        pointer: { value: pointer },
        image: { value: texture },
        aspect: { value: texture.image.width / texture.image.height },
        rect: { value: new Vector4() },
        speed: { value: 0 },
      },
    });
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
  });

  renderer.domElement.className = 'journal-ribbon-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.prepend(renderer.domElement);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

  return {
    point(x: number, y: number) { pointer.set(x, y); },
    resize(width: number, height: number) {
      if (viewport.x === width && viewport.y === height) return;
      viewport.set(width, height);
      renderer.setSize(width, height, false);
    },
    place(index: number, visible: boolean, x: number, y: number, width: number, height: number, speed: number) {
      const mesh = meshes[index];
      mesh.visible = visible;
      if (!visible) return;
      mesh.material.uniforms.rect.value.set(x, y, width, height);
      mesh.material.uniforms.speed.value = speed;
    },
    draw() { renderer.render(scene, camera); },
  };
}

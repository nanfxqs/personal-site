import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { InteractiveFigure } from '@/components/viz/InteractiveFigure';
import { Lazy3DScene } from '@/components/viz/Lazy3DScene';

function SaddleSurface({ scale }: { scale: number }) {
  const geometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(4, 4, 48, 48);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = scale * (x * x - y * y) * 0.25;
      pos.setZ(i, z);
    }
    geom.computeVertexNormals();
    return geom;
  }, [scale]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#c2410c"
          roughness={0.35}
          metalness={0.1}
          side={THREE.DoubleSide}
          wireframe={false}
        />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

export default function Surface3D() {
  const [scale, setScale] = useState(1.0);

  return (
    <InteractiveFigure
      title="3D 曲面直觉：双曲抛物面（马鞍面）z = a(x² - y²)"
      badge="3D WebGL 按需加载"
      caption="拖拽旋转视角、滚轮缩放；拖动滑块调节曲率参数 a，观察原点处驻点沿 x 轴极小、沿 y 轴极大的鞍点形态。"
      onReset={() => setScale(1.0)}
    >
      <Lazy3DScene height={340}>
        <Canvas camera={{ position: [4.2, 3.2, 4.2], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 8, 5]} intensity={1.1} />
          <SaddleSurface scale={scale} />
          <gridHelper args={[6, 12, '#a8a29e', '#57534e']} position={[0, -1.3, 0]} />
          <OrbitControls enableDamping />
        </Canvas>
      </Lazy3DScene>

      <div className="mt-4 flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs">
        <label htmlFor="saddle-scale" className="font-mono text-[var(--text-muted)]">
          曲率参数 a = {scale.toFixed(1)}
        </label>
        <input
          id="saddle-scale"
          type="range"
          min="0.2"
          max="2.0"
          step="0.1"
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          className="flex-1 accent-[var(--accent)]"
        />
      </div>
    </InteractiveFigure>
  );
}

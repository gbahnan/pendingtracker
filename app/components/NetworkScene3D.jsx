"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Real WebGL 3D scene (Three.js), not SVG or CSS polygons.
 * Reused for both networks with a distinct palette.
 */
export default function NetworkScene3D({ chain }) {
  const mountRef = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;
    let disposed = false, frame = 0, renderer, observer, scene;
    const cleanup = [];
    const start = async () => {
      try {
        const THREE = await import("three");
        if (disposed) return;
        const isBTC = chain === "btc";
        const tint = new THREE.Color(isBTC ? 0xffac23 : 0x238dff);
        const pale = new THREE.Color(isBTC ? 0xffe5a2 : 0xb2e5ff);
        scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
        camera.position.set(0, 6.2, 17.8);
        camera.lookAt(0, 0, 0);
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.55;
        renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
        host.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xb6c7ee, 0.52));
        const key = new THREE.PointLight(pale, 36, 15, 1.6);
        key.position.set(-3, 5, 5); scene.add(key);
        const fill = new THREE.PointLight(tint, 25, 15, 1.6);
        fill.position.set(4, 3, -3); scene.add(fill);

        // Three-dimensional floating crystalline blocks with real illuminated faces.
        const positions = [
          [-5.2, 0, -1.2],[-3.8, 0, 1.5],[-2.1, 0, -1.8],[-0.3, 0, 1.1],
          [1.8, 0, -1.5],[3.7, 0, 1.1],[5.2, 0, -0.7],
          [-4.6, 0, -3.3],[-1.3, 0, 3.0],[1.0, 0, -3.3],[4.7, 0, 3.0],
          [-3.1, 0, 3.4],[2.7, 0, 3.4],[0, 0, -0.1]
        ];
        const nodes = [];
        const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        const edgeGeometry = new THREE.EdgesGeometry(boxGeometry);
        const coreMaterial = new THREE.MeshPhysicalMaterial({
          color: tint, metalness: 0.22, roughness: 0.12,
          transmission: 0.35, thickness: 1.5, transparent: true,
          opacity: 0.84, clearcoat: 1, clearcoatRoughness: 0.07,
          emissive: tint, emissiveIntensity: 0.42,
          side: THREE.DoubleSide
        });
        const wireMaterial = new THREE.LineBasicMaterial({ color: pale, transparent: true, opacity: 0.95 });
        const dotMaterial = new THREE.MeshBasicMaterial({ color: pale });
        const dotGeo = new THREE.SphereGeometry(0.055, 10, 8);
        positions.forEach(([x, y, z], i) => {
          const big = [1,3,5,8,10].includes(i);
          const group = new THREE.Group();
          group.position.set(x, y, z);
          const scale = big ? 1.15 : (i % 3 === 0 ? 0.66 : 0.34);
          const cube = new THREE.Mesh(boxGeometry, coreMaterial);
          cube.scale.setScalar(scale);
          cube.rotation.y = Math.PI / 4;
          cube.rotation.x = 0.12;
          group.add(cube);
          const edges = new THREE.LineSegments(edgeGeometry, wireMaterial);
          edges.scale.setScalar(scale * 1.005);
          edges.rotation.copy(cube.rotation);
          group.add(edges);
          const dot = new THREE.Mesh(dotGeo, dotMaterial);
          dot.position.set(0, -0.65 * scale, 0);
          group.add(dot);
          if (big) {
            const light = new THREE.PointLight(tint, 3.5, 3.4, 1.6);
            light.position.set(0, 0.3, 0); group.add(light);
          }
          scene.add(group);
          nodes.push({ group, i, base: big ? 0.65 : 0.15, big });
        });

        // Fine three-dimensional network connections at a consistent plane.
        const edges = [];
        for (let i = 0; i < positions.length; i++) {
          const distances = positions.map((p,j) => ({j, d:Math.hypot(p[0]-positions[i][0],p[2]-positions[i][2])}))
            .filter(p=>p.j!==i).sort((a,b)=>a.d-b.d).slice(0,3);
          distances.forEach(({j}) => {
            if (j < i) return;
            edges.push(...positions[i].map((v,k)=>k===1?-0.72:v), ...positions[j].map((v,k)=>k===1?-0.72:v));
          });
        }
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
        const lines = new THREE.LineSegments(lineGeo,new THREE.LineBasicMaterial({ color:tint, transparent:true, opacity:0.45 }));
        scene.add(lines);
        const pointsGeo = new THREE.SphereGeometry(0.08, 10, 8);
        positions.forEach(([x,,z]) => {
          const dot = new THREE.Mesh(pointsGeo, new THREE.MeshBasicMaterial({color:pale}));
          dot.position.set(x,-0.72,z); scene.add(dot);
        });

        const resize = () => {
          if (!host || !renderer) return;
          const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
          renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
        };
        resize();
        observer = new ResizeObserver(resize);
        observer.observe(host);
        const clock = new THREE.Clock();
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const animate = () => {
          if(disposed)return;
          const t=clock.getElapsedTime();
          if (!reduced) nodes.forEach(({group,i,base,big})=>{
            group.position.y=base+Math.sin(t*0.55+i*1.9)*(big?0.33:0.18);
            group.rotation.y=Math.sin(t*0.15+i)*0.08;
          });
          renderer.render(scene,camera);
          frame=requestAnimationFrame(animate);
        };
        animate();
        cleanup.push(()=>{
          observer?.disconnect(); cancelAnimationFrame(frame);
          scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose?.();});
          [boxGeometry,edgeGeometry,coreMaterial,wireMaterial,dotMaterial,dotGeo,lineGeo,pointsGeo].forEach(x=>x.dispose());
          renderer.dispose();renderer.forceContextLoss();
          renderer.domElement.remove();
        });
      } catch (err) {
        if(!disposed){console.error("WebGL network scene unavailable",err);setFallback(true);}
      }
    };
    start();
    return ()=>{disposed=true;cleanup.forEach(fn=>fn());};
  }, [chain]);

  return <div ref={mountRef} className={"pt26-webgl-scene "+chain} role="img"
    aria-label={chain==="btc"?"Three-dimensional Bitcoin network of glowing connected cubes":"Three-dimensional Ethereum network of glowing connected cubes"}>
    {fallback && <div className="pt26-webgl-fallback">Live network visualization unavailable on this device.</div>}
  </div>;
}

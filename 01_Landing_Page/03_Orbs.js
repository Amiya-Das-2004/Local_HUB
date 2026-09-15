// Builds interactive 3D floating tab orbs with physics, particle clusters, shaders, and drag/click navigation using Three.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const BallGeo = new THREE.SphereGeometry(0.16, 8, 8);
const ShellGeoTab = new THREE.IcosahedronGeometry(4.0, 2);

function MakeLabel(Text, Color) {
  const Cv = document.createElement('canvas');
  Cv.width = 1024; Cv.height = 256;
  const Cx = Cv.getContext('2d');
  const Hex = '#' + new THREE.Color(Color).getHexString();
  Cx.textAlign = 'center'; Cx.textBaseline = 'middle';

  let Fs = 140;
  Cx.font = `700 ${Fs}px "JetBrains Mono", monospace`;
  while (Cx.measureText(Text).width > Cv.width * 0.80 && Fs > 40) {
    Fs -= 4;
    Cx.font = `700 ${Fs}px "JetBrains Mono", monospace`;
  }

  Cx.fillStyle = Hex;
  Cx.shadowColor = Hex;
  Cx.shadowBlur = 28;
  Cx.fillText(Text, 512, 128);
  Cx.shadowBlur = 18;
  Cx.fillText(Text, 512, 128);

  Cx.shadowColor = '#000000';
  Cx.shadowBlur = 6;
  Cx.lineWidth = 14;
  Cx.strokeStyle = '#000000';
  Cx.lineJoin = 'round';
  Cx.miterLimit = 2;
  Cx.strokeText(Text, 512, 128);

  Cx.shadowBlur = 0;
  Cx.fillStyle = '#ffffff';
  Cx.fillText(Text, 512, 128);

  const Tex = new THREE.CanvasTexture(Cv);
  Tex.minFilter = THREE.LinearFilter;
  const Mat = new THREE.SpriteMaterial({ map: Tex, transparent: true, depthTest: false, depthWrite: false, opacity: 0.95 });
  const S = new THREE.Sprite(Mat);
  // Change the set.(Width, Height, Depth) for the Tab Name
  S.scale.set(7, 1.75, 1);
  return S;
}

export class Orb {
  constructor(Tab, Index, Total, Scene) {
    this.Tab = Tab;
    this.Index = Index;
    this.Color = new THREE.Color(Tab.Color);

    const Ang = (Index / Total) * Math.PI * 2 - Math.PI / 2;
    const Hr = 10;
    this.Pos = new THREE.Vector3(Math.cos(Ang) * Hr, Math.sin(Ang) * Hr + 3, 0);
    this.Vel = new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, 0);
    this.Radius = 3.5;
    // Scaling The Orb When Hovering
    this.MaxScale = 1.5;

    this.Group = new THREE.Group();
    this.Group.position.copy(this.Pos);
    Scene.add(this.Group);

    this.Shell = new THREE.Mesh(ShellGeoTab, new THREE.MeshBasicMaterial({
      color: this.Color, wireframe: true, transparent: true, opacity: 0.22, depthWrite: false
    }));
    this.Group.add(this.Shell);

    this.ClusterGroup = new THREE.Group();
    this.Group.add(this.ClusterGroup);
    this.Balls = [];
    const BallMat = new THREE.MeshBasicMaterial({ color: this.Color, transparent: true, opacity: 0.55 });

    for (let I = 0; I < 14; I++) {
      const Ball = new THREE.Mesh(BallGeo, BallMat);
      const Th = Math.random() * Math.PI * 2;
      const Ph = Math.acos(Math.random() * 2 - 1);
      const R = this.Radius * (0.35 + Math.random() * 0.5);
      const Bp = new THREE.Vector3(R * Math.sin(Ph) * Math.cos(Th), R * Math.cos(Ph), R * Math.sin(Ph) * Math.sin(Th));
      Ball.position.copy(Bp);
      Ball.scale.setScalar(0.6 + Math.random() * 0.9);
      Ball.userData = { BasePos: Bp.clone(), Phase: Math.random() * Math.PI * 2, Speed: 0.4 + Math.random() * 0.8, Amp: 0.08 + Math.random() * 0.14 };
      this.ClusterGroup.add(Ball);
      this.Balls.push(Ball);
    }

    const MaxB = 14 * 13 / 2;
    this.BondPos = new Float32Array(MaxB * 6);
    this.BondGeo = new THREE.BufferGeometry();
    this.BondGeo.setAttribute('position', new THREE.BufferAttribute(this.BondPos, 3));
    this.BondGeo.setDrawRange(0, 0);
    this.Bonds = new THREE.LineSegments(this.BondGeo, new THREE.LineBasicMaterial({
      color: this.Color, transparent: true, opacity: 0.15, depthWrite: false
    }));
    this.ClusterGroup.add(this.Bonds);

    this.Core = new THREE.Mesh(
      new THREE.SphereGeometry(this.Radius * 0.28, 16, 16),
      new THREE.MeshBasicMaterial({ color: this.Color, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    this.Group.add(this.Core);

    this.Halo = new THREE.Mesh(
      new THREE.SphereGeometry(this.Radius * 1.4, 20, 20),
      new THREE.ShaderMaterial({
        uniforms: { UColor: { value: this.Color.clone() }, UHover: { value: 0 } },
        vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 UColor; uniform float UHover; varying vec3 vN; void main(){ float i = pow(0.7 - dot(vN, vec3(0,0,1)), 2.4); gl_FragColor = vec4(UColor, 1.0) * i * (0.16 + UHover * 0.35); }`,
        blending: THREE.AdditiveBlending, transparent: true, side: THREE.BackSide, depthWrite: false
      })
    );
    this.Group.add(this.Halo);

    this.HitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(this.Radius * 1.5, 10, 10),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    this.Group.add(this.HitSphere);

    this.Label = MakeLabel(Tab.Name, Tab.Color);
    this.Label.position.set(0, 0, 0); // Put it back perfectly in the center
    this.Label.renderOrder = 999;     // Force Three.js to draw this LAST (always on top)
    this.Group.add(this.Label);

    this.HoverT = 0;
    this.TargetHoverT = 0;
    this.IsDragging = false;
    this.DragOffset = new THREE.Vector3();
  }

  Update(Dt, Time, Orbs, Viewport) {
    // --- Responsive Scaling Logic ---
    const maxWindowW = 1024; // Width where laptop size starts
    const minWindowW = 400;  // Width where phone size starts
    const minOrbScale = 0.5; // 50% size on phones
    const maxOrbScale = 1.0; // 100% size on laptops
    
    let progress = (window.innerWidth - minWindowW) / (maxWindowW - minWindowW);
    progress = Math.max(0, Math.min(1, progress)); // Clamp between 0 and 1
    this.ResponsiveScale = minOrbScale + progress * (maxOrbScale - minOrbScale);
    
    // Update the physics radius dynamically
    this.Radius = 3.5 * this.ResponsiveScale;

    if (!this.IsDragging) {
      for (const Other of Orbs) {
        if (Other === this) continue;
        const Dx = this.Pos.x - Other.Pos.x;
        const Dy = this.Pos.y - Other.Pos.y;
        const D = Math.sqrt(Dx * Dx + Dy * Dy);
        
        // Scale the gap between orbs as well
        const ScaledGap = 1.5 * this.ResponsiveScale;
        const MinD = (this.Radius + Other.Radius + ScaledGap) * 3;
        
        if (D < MinD && D > 0.01) {
          const F = (MinD - D) / MinD * 0.28;
          this.Vel.x += (Dx / D) * F;
          this.Vel.y += (Dy / D) * F;
        }
      }

      const WallMargin = this.Radius * 4.0;
      const WallForce = 0.5;

      const LeftDist = this.Pos.x - Viewport.MinX;
      if (LeftDist < WallMargin) { this.Vel.x += (WallMargin - LeftDist) / WallMargin * WallForce; }
      const RightDist = Viewport.MaxX - this.Pos.x;
      if (RightDist < WallMargin) { this.Vel.x -= (WallMargin - RightDist) / WallMargin * WallForce; }
      const TopDist = Viewport.MaxY - this.Pos.y;
      if (TopDist < WallMargin) { this.Vel.y -= (WallMargin - TopDist) / WallMargin * WallForce * 0.5; } // Reduced top repulsion
      const BotDist = this.Pos.y - Viewport.MinY;
      if (BotDist < WallMargin) { this.Vel.y += (WallMargin - BotDist) / WallMargin * WallForce * 5.0; }

      // Center Attraction (Gravity moved upward to protect the footer)
      const CenterPull = 0.004; 
      const CenterY = 5.0; // The cluster will now naturally hover 5 units above the dead center
      this.Vel.x += (0 - this.Pos.x) * CenterPull;
      this.Vel.y += (CenterY - this.Pos.y) * CenterPull;

      this.Vel.x += (Math.random() - 0.5) * 0.008;
      this.Vel.y += (Math.random() - 0.5) * 0.008;

      this.Vel.multiplyScalar(0.93);
      this.Pos.add(this.Vel);

      const Hard = this.Radius * 1.0;
      if (this.Pos.x < Viewport.MinX + Hard) { this.Pos.x = Viewport.MinX + Hard; this.Vel.x = Math.abs(this.Vel.x) * 0.3; }
      if (this.Pos.x > Viewport.MaxX - Hard) { this.Pos.x = Viewport.MaxX - Hard; this.Vel.x = -Math.abs(this.Vel.x) * 0.3; }
      if (this.Pos.y < Viewport.MinY + Hard) { this.Pos.y = Viewport.MinY + Hard; this.Vel.y = Math.abs(this.Vel.y) * 0.3; }
      if (this.Pos.y > Viewport.MaxY - Hard) { this.Pos.y = Viewport.MaxY - Hard; this.Vel.y = -Math.abs(this.Vel.y) * 0.3; }
    } else {
      this.Vel.set(0, 0, 0);
    }
    this.Group.position.copy(this.Pos);

    for (const Ball of this.Balls) {
      const U = Ball.userData;
      Ball.position.x = U.BasePos.x + Math.sin(Time * U.Speed + U.Phase) * U.Amp;
      Ball.position.y = U.BasePos.y + Math.cos(Time * U.Speed * 1.3 + U.Phase) * U.Amp;
      Ball.position.z = U.BasePos.z + Math.sin(Time * U.Speed * 0.7 + U.Phase * 2) * U.Amp;
    }
    this.ClusterGroup.rotation.y += Dt * (0.15 + this.HoverT * 0.8);

    let Bi = 0;
    const Thr = 2.0;
    for (let I = 0; I < this.Balls.length; I++) {
      for (let J = I + 1; J < this.Balls.length; J++) {
        const P1 = this.Balls[I].position, P2 = this.Balls[J].position;
        if (P1.distanceTo(P2) < Thr) {
          this.BondPos[Bi * 6] = P1.x; this.BondPos[Bi * 6 + 1] = P1.y; this.BondPos[Bi * 6 + 2] = P1.z;
          this.BondPos[Bi * 6 + 3] = P2.x; this.BondPos[Bi * 6 + 4] = P2.y; this.BondPos[Bi * 6 + 5] = P2.z;
          Bi++;
        }
      }
    }
    this.BondGeo.setDrawRange(0, Bi * 2);
    this.BondGeo.attributes.position.needsUpdate = true;

    this.HoverT += (this.TargetHoverT - this.HoverT) * 0.12;
    const H = this.HoverT;
    
    // Apply the responsive scale on top of the hover scale!
    const Sc = this.ResponsiveScale * (1 + H * (this.MaxScale - 1));
    this.Group.scale.setScalar(Sc);
    
    this.Shell.rotation.y += Dt * (0.5 + H * 0.2);
    this.Shell.rotation.x += Dt * (0.5 + H * 0.2);
    this.Shell.material.opacity = 0.22 + H * 0.3;
    this.Core.material.opacity = 0.3 + H * 0.25;
    this.Halo.material.uniforms.UHover.value = H;
    this.ClusterGroup.scale.setScalar(1 + H * 0.15);
    this.Bonds.material.opacity = 0.15 + H * 0.2;
    this.Label.material.opacity = 0.95;
  }
}

export function SetupInputs(Renderer, Camera, Orbs, Viewport) {
  const Raycaster = new THREE.Raycaster();
  const MouseNdc = new THREE.Vector2();
  const PlaneZ0 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  let DraggingOrb = null;
  const MouseDownScreen = new THREE.Vector2();
  const TouchStartScreen = new THREE.Vector2();

  function ScreenToWorld(Sx, Sy) {
    MouseNdc.x = (Sx / window.innerWidth) * 2 - 1;
    MouseNdc.y = -(Sy / window.innerHeight) * 2 + 1;
    Raycaster.setFromCamera(MouseNdc, Camera);
    const Hit = new THREE.Vector3();
    Raycaster.ray.intersectPlane(PlaneZ0, Hit);
    return Hit;
  }

  function GetHoveredOrb(Cx, Cy) {
    MouseNdc.x = (Cx / window.innerWidth) * 2 - 1;
    MouseNdc.y = -(Cy / window.innerHeight) * 2 + 1;
    Raycaster.setFromCamera(MouseNdc, Camera);
    const Targets = Orbs.map(O => O.HitSphere);
    const Hits = Raycaster.intersectObjects(Targets, false);
    if (Hits.length > 0) return Orbs.findIndex(O => O.HitSphere === Hits[0].object);
    return -1;
  }

  Renderer.domElement.addEventListener('mousedown', (E) => {
    MouseDownScreen.set(E.clientX, E.clientY);
    const Idx = GetHoveredOrb(E.clientX, E.clientY);
    if (Idx >= 0) {
      DraggingOrb = Orbs[Idx];
      DraggingOrb.IsDragging = true;
      const Wp = ScreenToWorld(E.clientX, E.clientY);
      DraggingOrb.DragOffset.copy(Wp).sub(DraggingOrb.Pos);
      document.body.style.cursor = 'grabbing';
    }
  });

  window.addEventListener('mousemove', (E) => {
    if (DraggingOrb) {
      const Wp = ScreenToWorld(E.clientX, E.clientY);
      DraggingOrb.Pos.copy(Wp).sub(DraggingOrb.DragOffset);
      const Hard = DraggingOrb.Radius * 1.0;
      DraggingOrb.Pos.x = Math.max(Viewport.MinX + Hard, Math.min(Viewport.MaxX - Hard, DraggingOrb.Pos.x));
      DraggingOrb.Pos.y = Math.max(Viewport.MinY + Hard, Math.min(Viewport.MaxY - Hard, DraggingOrb.Pos.y));
    } else {
      const Idx = GetHoveredOrb(E.clientX, E.clientY);
      Orbs.forEach((O, I) => O.TargetHoverT = (I === Idx) ? 1 : 0);
      document.body.style.cursor = Idx >= 0 ? 'pointer' : 'default';
    }
  });

  window.addEventListener('mouseup', (E) => {
    if (DraggingOrb) {
      const Moved = Math.hypot(E.clientX - MouseDownScreen.x, E.clientY - MouseDownScreen.y);
      DraggingOrb.IsDragging = false;
      if (Moved < 5) {
        const targetUrl = DraggingOrb.Tab.Url || '';
        if (targetUrl.startsWith('#')) {
          window.location.hash = targetUrl;
        } else {
          window.open(targetUrl, '_blank');
        }
      }
      DraggingOrb = null;
    }
    document.body.style.cursor = 'default';
  });

  Renderer.domElement.addEventListener('touchstart', (E) => {
    if (E.touches.length !== 1) return;
    const T = E.touches[0];
    TouchStartScreen.set(T.clientX, T.clientY);
    MouseDownScreen.set(T.clientX, T.clientY);
    const Idx = GetHoveredOrb(T.clientX, T.clientY);
    if (Idx >= 0) {
      DraggingOrb = Orbs[Idx];
      DraggingOrb.IsDragging = true;
      const Wp = ScreenToWorld(T.clientX, T.clientY);
      DraggingOrb.DragOffset.copy(Wp).sub(DraggingOrb.Pos);
    }
  }, { passive: true });

  Renderer.domElement.addEventListener('touchmove', (E) => {
    if (E.touches.length !== 1 || !DraggingOrb) return;
    const T = E.touches[0];
    const Wp = ScreenToWorld(T.clientX, T.clientY);
    DraggingOrb.Pos.copy(Wp).sub(DraggingOrb.DragOffset);
    const Hard = DraggingOrb.Radius * 1.0;
    DraggingOrb.Pos.x = Math.max(Viewport.MinX + Hard, Math.min(Viewport.MaxX - Hard, DraggingOrb.Pos.x));
    DraggingOrb.Pos.y = Math.max(Viewport.MinY + Hard, Math.min(Viewport.MaxY - Hard, DraggingOrb.Pos.y));
  }, { passive: true });

  Renderer.domElement.addEventListener('touchend', (E) => {
    if (DraggingOrb) {
      const T = E.changedTouches[0];
      const Moved = Math.hypot(T.clientX - TouchStartScreen.x, T.clientY - TouchStartScreen.y);
      DraggingOrb.IsDragging = false;
      if (Moved < 10) {
        const targetUrl = DraggingOrb.Tab.Url || '';
        if (targetUrl.startsWith('#')) {
          window.location.hash = targetUrl;
        } else {
          window.open(targetUrl, '_blank');
        }
      }
      DraggingOrb = null;
    }
  });
}

export function InitOrbs(container, state) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0x0a1a14, 0.35);
  scene.add(ambientLight);

  const orbs = [];
  if (state.tabs && state.tabs.length > 0) {
    state.tabs.forEach((tab, index) => {
      orbs.push(new Orb(tab, index, state.tabs.length, scene));
    });
  }

  const CamZ = 40;
  camera.position.z = CamZ;

  let Viewport = { MinX: -35, MaxX: 35, MinY: -20, MaxY: 20 };
  function UpdateViewport() {
    const FovRad = THREE.MathUtils.degToRad(camera.fov);
    const Vh = 2 * CamZ * Math.tan(FovRad / 2);
    const Vw = Vh * camera.aspect;
    Viewport.MinX = -Vw / 2; Viewport.MaxX = Vw / 2;
    Viewport.MinY = -Vh / 2; Viewport.MaxY = Vh / 2;
  }
  UpdateViewport();

  SetupInputs(renderer, camera, orbs, Viewport);

  const clock = new THREE.Clock();

  function animate() {
    if (!container || !container.isConnected) return;
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, clock.getDelta());
    const time = clock.getElapsedTime();

    orbs.forEach(orb => orb.Update(dt, time, orbs, Viewport));

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    UpdateViewport();
  });
}

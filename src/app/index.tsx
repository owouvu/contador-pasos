import { Accelerometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  const [pasos, setPasos] = useState(0);
  const [estado, setEstado] = useState("Quieto");

  // refs para guardar valores entre lecturas sin re-renderizar
  const ultimoPico = useRef(0); // momento del último paso
  const magnitudes = useRef<number[]>([]); // fuerzas recientes para clasificar

  useEffect(() => {
    // El sensor entrega datos cada 100 ms (10 veces por segundo)
    Accelerometer.setUpdateInterval(100);

    const sub = Accelerometer.addListener(({ x, y, z }) => {
      // 1) Magnitud: combina los 3 ejes en un solo número de "sacudida"
      const magnitud = Math.sqrt(x * x + y * y + z * z);

      // 2) Guardamos las últimas ~15 lecturas para medir intensidad
      magnitudes.current.push(magnitud);
      if (magnitudes.current.length > 15) magnitudes.current.shift();

      const ahora = Date.now();
      const UMBRAL_PASO = 1.3; // fuerza mínima para considerar un pisada
      const TIEMPO_MINIMO = 250; // ms mínimos entre pasos (evita ruido)

      // 3) Detectar un paso: pico por encima del umbral + tiempo suficiente
      if (
        magnitud > UMBRAL_PASO &&
        ahora - ultimoPico.current > TIEMPO_MINIMO
      ) {
        ultimoPico.current = ahora;
        setPasos((p) => p + 1);

        // 4) Clasificar caminar vs correr según la fuerza promedio
        const promedio =
          magnitudes.current.reduce((a, b) => a + b, 0) /
          magnitudes.current.length;

        if (promedio > 1.7) setEstado("Corriendo 🏃");
        else setEstado("Caminando 🚶");
      }
    });

    // Si no hay movimiento por un rato, marcar "Quieto"
    const revisor = setInterval(() => {
      if (Date.now() - ultimoPico.current > 1500) setEstado("Quieto");
    }, 500);

    // limpiar al cerrar
    return () => {
      sub.remove();
      clearInterval(revisor);
    };
  }, []);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Pasos</Text>
      <Text style={styles.numero}>{pasos}</Text>
      <Text style={styles.estado}>{estado}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#921592",
  },
  titulo: { color: "#fffcfc", fontSize: 24 },
  numero: { color: "#00b1fd", fontSize: 90, fontWeight: "bold" },
  estado: { color: "#ff20b8", fontSize: 32, marginTop: 20 },
});

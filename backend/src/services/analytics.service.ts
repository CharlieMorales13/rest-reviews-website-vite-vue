import { spawn } from 'child_process';
import path from 'path';

export const runSentimentAnalysis = () => {
  return new Promise((resolve, reject) => {
    // Ruta al ejecutable de python en tu venv de la Lenovo
    const pythonPath = path.join(__dirname, '../../../venv/bin/python');
    // Ruta a tu script de analítica
    const scriptPath = path.join(__dirname, '../../../analytics/pipeline.py');

    const pythonProcess = spawn(pythonPath, [scriptPath]);

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Error en Python: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(dataString);
          resolve(result);
        } catch (e) {
          resolve({ message: "Análisis completado", status: "success" });
        }
      } else {
        reject(`El proceso de Python falló con código ${code}`);
      }
    });
  });
};

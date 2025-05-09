import React, { useState, useEffect } from "react";
import {
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  Paper,
  Tooltip,
  rgbToHex,
} from "@mui/material";

const API_BASE = "http://20.244.56.144/evaluation-service/stocks";

// Calculate average
const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length || 0;

const stdDev = (arr) => {
  const avg = average(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - avg) ** 2, 0) / (arr.length - 1 || 1));
};

const covariance = (x, y) => {
  const avgX = average(x);
  const avgY = average(y);
  let cov = 0;
  for (let i = 0; i < x.length; i++) cov += (x[i] - avgX) * (y[i] - avgY);
  return cov / (x.length - 1 || 1);
};


const pearsonCorrelation = (x, y) => {
  const cov = covariance(x, y);
  const stdX = stdDev(x);
  const stdY = stdDev(y);
  if (stdX === 0 || stdY === 0) return 0;
  return cov / (stdX * stdY);
};


const alignData = (stocksData) => {
  if (stocksData.length === 0) return { aligned: [], timestamps: [] };
  const timestamps = stocksData[0].map((p) => p.timestamp);
  // Find intersection of timestamps
  for (let i = 1; i < stocksData.length; i++) {
    const tsSet = new Set(stocksData[i].map((p) => p.timestamp));
    for (let j = timestamps.length - 1; j >= 0; j--) {
      if (!tsSet.has(timestamps[j])) timestamps.splice(j, 1);
    }
  }
  
  const aligned = stocksData.map((stock) =>
    timestamps.map((t) => stock.find((p) => p.timestamp === t)?.price || 0)
  );
  return { aligned, timestamps };
};


const colorScale = (val) => {
  const r = val < 0 ? 255 : Math.floor(255 * (1 - val));
  const g = val > 0 ? 255 : Math.floor(255 * (1 + val));
  const b = val < 0 ? Math.floor(255 * (1 + val)) : Math.floor(255 * (1 - val));
  return rgbToHex(`${r}`,`${g}`,`${b}`);
};

export default function CorrelationHeatmap() {
  const stocks = ["AAPL", "GOOG", "MSFT", "AMZN"]; 
  const [minutes, setMinutes] = useState(30);
  const [pricesData, setPricesData] = useState([]);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    setLoading(true);
    Promise.all(
      stocks.map((sym) =>
        fetch(`${API_BASE}/stocks/${sym}/prices?minutes=${minutes}`).then((res) => res.json())
      )
    )
      .then(setPricesData)
      .finally(() => setLoading(false));
  }, [minutes]);

  const { aligned } = alignData(pricesData);


  const correlationMatrix = [];
  for (let i = 0; i < stocks.length; i++) {
    correlationMatrix[i] = [];
    for (let j = 0; j < stocks.length; j++) {
      correlationMatrix[i][j] =
        i === j ? 1 : pearsonCorrelation(aligned[i] || [], aligned[j] || []);
    }
  }

  return (
    <Paper sx={{ p: 3, overflowX: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Correlation Heatmap
      </Typography>

      <FormControl sx={{ minWidth: 150, mb: 2 }}>
        <InputLabel>Last Minutes</InputLabel>
        <Select
          value={minutes}
          label="Last Minutes"
          onChange={(e) => setMinutes(e.target.value)}
        >
          {[5, 15, 30, 60, 120].map((m) => (
            <MenuItem key={m} value={m}>
              Last {m} minutes
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 400 }}>
          <thead>
            <tr>
              <th></th>
              {stocks.map((s) => (
                <th
                  key={s}
                  style={{ border: "1px solid #ccc", padding: 8, textAlign: "center" }}
                >
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, i) => (
              <tr key={stock}>
                <th
                  style={{ border: "1px solid #ccc", padding: 8, textAlign: "center" }}
                >
                  <Tooltip
                    title={
                      pricesData[i]
                        ? `Avg: ${average(pricesData[i].map((p) => p.price)).toFixed(
                            2
                          )}, StdDev: ${stdDev(pricesData[i].map((p) => p.price)).toFixed(2)}`
                        : "Loading..."
                    }
                  >
                    <span>{stock}</span>
                  </Tooltip>
                </th>
                {correlationMatrix[i].map((val, j) => (
                  <td
                    key={j}
                    style={{
                      border: "1px solid #ccc",
                      padding: 8,
                      backgroundColor: colorScale(val),
                      color: Math.abs(val) > 0.5 ? "white" : "black",
                      textAlign: "center",
                    }}
                    title={`Correlation: ${val.toFixed(2)}`}
                  >
                    {val.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Paper>
  );
}
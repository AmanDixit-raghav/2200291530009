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
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

const API_BASE = "http://20.244.56.144/evaluation-service/stocks"; 

export default function StockPage() {
  const [stock, setStock] = useState("AAPL");
  const [minutes, setMinutes] = useState(30);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch stock prices for selected stock and minutes
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/stocks/${stock}/prices?minutes=${minutes}`)
      .then((res) => res.json())
      .then((prices) => {
        
        const chartData = prices.map((p) => ({
          time: new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          price: p.price,
        }));
        setData(chartData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [stock, minutes]);

  // Calculate average price
  const average =
    data.length > 0 ? data.reduce((acc, p) => acc + p.price, 0) / data.length : 0;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Stock Price Chart
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Stock</InputLabel>
          <Select value={stock} label="Stock" onChange={(e) => setStock(e.target.value)}>
            <MenuItem value="AAPL">AAPL</MenuItem>
            <MenuItem value="GOOG">GOOG</MenuItem>
            <MenuItem value="MSFT">MSFT</MenuItem>
            <MenuItem value="AMZN">AMZN</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
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
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      ) : data.length === 0 ? (
        <Typography>No data available.</Typography>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip />
            <Line type="monotone" dataKey="price" stroke="#1976d2" dot />
            <ReferenceLine
              y={average}
              stroke="red"
              strokeDasharray="3 3"
              label={`Avg: ${average.toFixed(2)}`}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}
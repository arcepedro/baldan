/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Send,
  Settings,
  CheckCircle,
  AlertCircle,
  LayoutDashboard,
  Activity,
  ArrowLeft,
  ChevronRight,
  Filter,
  X,
  ChevronDown,
} from "lucide-react";
import {
  LineChart,
  ComposedChart,
  Line,
  LabelList,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from "recharts";

type ViewState = "intro" | "home" | "form" | "dashboard" | "settings";

const TopChartCard = ({ data, dataKey, title, color }: any) => {
  const sortedData = [...data].sort(
    (a: any, b: any) => b[dataKey] - a[dataKey],
  );
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col h-[300px]">
      <h2 className="text-center font-bold text-slate-800 mb-2 text-xs uppercase tracking-wider">
        {title}
      </h2>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={sortedData}
            margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              stroke="#E2E8F0"
            />
            <XAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 9, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val: string) =>
                val.length > 10 ? val.substring(0, 8) + "..." : val
              }
            />
            <YAxis
              type="number"
              tick={{ fontSize: 9, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                fontSize: "10px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function App() {
  const defaultForm = {
    usina: "",
    talhao: "",
    produtos: "",
    dose: "",
    dias30: "",
    dias60: "",
    dias90: "",
    dias120: "",
    modalidade: "",
    operacao: "",
  };

  const [currentView, setCurrentView] = useState<ViewState>("intro");
  const [formData, setFormData] = useState(defaultForm);
  const [scriptUrl, setScriptUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  const [dashboardFilters, setDashboardFilters] = useState<{
    usina: string[];
    modalidade: string[];
    operacao: string[];
    produtoDesc: string;
  }>({
    usina: [],
    modalidade: [],
    operacao: [],
    produtoDesc: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [rankingMetric, setRankingMetric] = useState<
    "media" | "dias30" | "dias60" | "dias90"
  >("media");

  const toggleFilter = (
    type: "usina" | "modalidade" | "operacao",
    value: string,
  ) => {
    setDashboardFilters((prev) => {
      const current = prev[type];
      return {
        ...prev,
        [type]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  };

  // Intro Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentView("home");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentView === "dashboard" && scriptUrl) {
      fetchDashboardData();
    }
  }, [currentView, scriptUrl]);

  const fetchDashboardData = async () => {
    setIsLoadingDashboard(true);
    setDashboardError("");
    try {
      const response = await fetch(scriptUrl);
      if (!response.ok) throw new Error("Falha ao buscar dados");

      const data = await response.json();
      setDashboardData(data);
    } catch (err: any) {
      setDashboardError(
        "Erro ao carregar dados da planilha. Verifique a URL do App Script e tente novamente.",
      );
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const uniqueUsinas = Array.from(
    new Set(
      dashboardData
        .map((item: any) => String(item.usina || ""))
        .filter(Boolean),
    ),
  ) as string[];
  const uniqueModalidades = Array.from(
    new Set(
      dashboardData
        .map((item: any) => String(item.modalidade || ""))
        .filter(Boolean),
    ),
  ) as string[];
  const uniqueOperacoes = Array.from(
    new Set(
      dashboardData
        .map((item: any) => String(item.operacao || ""))
        .filter(Boolean),
    ),
  ) as string[];

  const dashboardRanking = dashboardData
    .filter((item: any) => {
      if (
        dashboardFilters.usina.length > 0 &&
        !dashboardFilters.usina.includes(String(item.usina || ""))
      )
        return false;
      if (
        dashboardFilters.modalidade.length > 0 &&
        !dashboardFilters.modalidade.includes(String(item.modalidade || ""))
      )
        return false;
      if (
        dashboardFilters.operacao.length > 0 &&
        !dashboardFilters.operacao.includes(String(item.operacao || ""))
      )
        return false;
      if (
        dashboardFilters.produtoDesc &&
        !String(item.produtos || "")
          .toLowerCase()
          .includes(dashboardFilters.produtoDesc.toLowerCase())
      )
        return false;
      return true;
    })
    .map((item: any, index: number) => {
      const valor =
        parseFloat(String(item[rankingMetric] || "0").replace(",", ".")) || 0;
      return {
        id: index,
        name: String(item.produtos || "Produto Indefinido"),
        usina: String(item.usina || "Desconhecida"),
        modalidade: String(item.modalidade || "Desconhecida"),
        operacao: String(item.operacao || "Desconhecida"),
        dose: String(item.dose || "0"),
        valor: valor,
        media: parseFloat(String(item.media || "0").replace(",", ".")) || 0,
        dias30: parseFloat(String(item.dias30 || "0").replace(",", ".")) || 0,
        dias60: parseFloat(String(item.dias60 || "0").replace(",", ".")) || 0,
        dias90: parseFloat(String(item.dias90 || "0").replace(",", ".")) || 0,
        dias120: parseFloat(String(item.dias120 || "0").replace(",", ".")) || 0,
      };
    })
    .sort((a, b) => b.valor - a.valor);

  const calcAverage = (data: any[], key: string) =>
    data.reduce((acc, curr) => acc + curr[key], 0) / (data.length || 1);
  const getBest = (data: any[], key: string) =>
    [...data].sort((a, b) => b[key] - a[key])[0] || { name: "-", [key]: 0 };

  const kpis = {
    media: {
      avg: calcAverage(dashboardRanking, "media"),
      best: getBest(dashboardRanking, "media"),
    },
    dias30: {
      avg: calcAverage(dashboardRanking, "dias30"),
      best: getBest(dashboardRanking, "dias30"),
    },
    dias60: {
      avg: calcAverage(dashboardRanking, "dias60"),
      best: getBest(dashboardRanking, "dias60"),
    },
  };

  const mediaByUsinaMap = dashboardRanking.reduce(
    (
      acc: Record<string, { usina: string; count: number; sum: number }>,
      curr: any,
    ) => {
      if (!acc[curr.usina])
        acc[curr.usina] = { usina: curr.usina, count: 0, sum: 0 };
      acc[curr.usina].sum += curr.media;
      acc[curr.usina].count += 1;
      return acc;
    },
    {},
  );

  const mediaByUsina = Object.values(mediaByUsinaMap)
    .map((u: any) => ({
      name: u.usina,
      valor: parseFloat((u.sum / u.count).toFixed(2)),
    }))
    .sort((a: any, b: any) => b.valor - a.valor);

  // Load Settings
  useEffect(() => {
    const savedUrl = localStorage.getItem("baldan_script_url");
    if (savedUrl) {
      setScriptUrl(savedUrl);
    }
  }, []);

  // Calculation for internal display
  const mediaVal = () => {
    const values = [formData.dias30, formData.dias60, formData.dias90]
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v));

    if (values.length === 0) return "";

    const sum = values.reduce((acc, curr) => acc + curr, 0);
    return (sum / values.length).toFixed(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveScriptUrl = () => {
    if (!scriptUrl.includes("script.google.com")) {
      alert('A URL deve conter "script.google.com"');
      return;
    }
    localStorage.setItem("baldan_script_url", scriptUrl);
    setCurrentView("home");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptUrl) {
      setError(
        "Por favor, configure a URL do Google Apps Script nas configurações primeiro.",
      );
      setCurrentView("settings");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const payload = {
      ...formData,
      media: mediaVal(),
    };

    try {
      await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify(payload),
      });

      setShowSuccess(true);
      setFormData(defaultForm);
      window.scrollTo({ top: 0, behavior: "smooth" });

      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      setError(
        "Erro de conexão ao enviar dados. Verifique a internet e tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- VIEWS ---

  if (currentView === "intro") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center animate-in zoom-in duration-1000 slide-in-from-bottom-10 fade-in">
          <div className="w-64 mb-6 flex justify-center">
            <img
              src="https://ifudxfllenrtbhollajq.supabase.co/storage/v1/object/sign/baldan/Imagem1.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MzYxYzhmMC1mYjlhLTRlOGItOTFiYi0wZDVhNjdkMDE2YzEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWxkYW4vSW1hZ2VtMS5wbmciLCJpYXQiOjE3Nzc5MTUzMzYsImV4cCI6MTgwOTQ1MTMzNn0.ilwwIprY6-MZADrPytZJ4c0MVUyPxVNmEwraQK66dns"
              alt="Logo"
              className="w-full h-auto object-contain drop-shadow-md"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "home") {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col pb-[50px] animate-in fade-in duration-500">
        <header className="bg-[#8C181E] text-white p-4 shadow-md sticky top-0 z-10">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm overflow-hidden p-1.5 flex-shrink-0">
                <img
                  src="https://ifudxfllenrtbhollajq.supabase.co/storage/v1/object/sign/baldan/Imagem1.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MzYxYzhmMC1mYjlhLTRlOGItOTFiYi0wZDVhNjdkMDE2YzEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWxkYW4vSW1hZ2VtMS5wbmciLCJpYXQiOjE3Nzc5MTUzMzYsImV4cCI6MTgwOTQ1MTMzNn0.ilwwIprY6-MZADrPytZJ4c0MVUyPxVNmEwraQK66dns"
                  alt="Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <button
              onClick={() => setCurrentView("settings")}
              className="p-2 rounded-full hover:bg-black/10 transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-xl mx-auto w-full p-6 flex flex-col justify-center space-y-10">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
              BEM-VINDO AO BALDAN CONNECTED SPRAY
            </h1>
            <p className="text-base text-slate-500 font-medium max-w-[280px] mx-auto">
              Selecione um dos módulos abaixo para iniciar sua gestão.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Dashboard Button */}
            <button
              onClick={() => setCurrentView("dashboard")}
              className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
            >
              <div className="bg-slate-100 p-4 rounded-xl text-[#8C181E] group-hover:bg-[#8C181E] group-hover:text-white transition-colors">
                <LayoutDashboard size={32} />
              </div>
              <div className="ml-4 flex-1 text-left">
                <h2 className="text-xl font-bold text-slate-800">
                  Painel Geral
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                  Acessar Módulo
                </p>
              </div>
              <ChevronRight className="text-slate-300" />
            </button>

            {/* Operations Button */}
            <button
              onClick={() => setCurrentView("form")}
              className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
            >
              <div className="bg-slate-100 p-4 rounded-xl text-[#8C181E] group-hover:bg-[#8C181E] group-hover:text-white transition-colors">
                <Activity size={32} />
              </div>
              <div className="ml-4 flex-1 text-left">
                <h2 className="text-xl font-bold text-slate-800">
                  Novo Cadastro
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                  Acessar Módulo
                </p>
              </div>
              <ChevronRight className="text-slate-300" />
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (currentView === "dashboard") {
    return (
      <div className="min-h-screen bg-slate-50 font-sans pb-[50px] animate-in fade-in duration-500">
        <header className="bg-[#8C181E] text-white p-4 shadow-md sticky top-0 z-10 flex items-center">
          <button
            onClick={() => setCurrentView("home")}
            className="p-2 mr-3 rounded-full hover:bg-black/10 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg leading-tight tracking-wide">
              Painel Geral
            </h1>
            <p className="text-red-100/80 text-xs font-medium">
              Ranking de Eficiência
            </p>
          </div>
        </header>

        <main className="w-full max-w-7xl mx-auto p-4 pt-6 space-y-6">
          {isLoadingDashboard ? (
            <div className="text-center p-8 text-slate-500 font-medium animate-pulse">
              Carregando dados da planilha...
            </div>
          ) : dashboardError ? (
            <div className="text-center p-8 text-red-500 font-medium">
              {dashboardError}
              <button
                onClick={() => setCurrentView("settings")}
                className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold shadow-sm"
              >
                Verificar Web App URL
              </button>
            </div>
          ) : dashboardRanking.length === 0 &&
            !dashboardFilters.produtoDesc &&
            dashboardFilters.usina.length === 0 &&
            dashboardFilters.modalidade.length === 0 &&
            dashboardFilters.operacao.length === 0 ? (
            <div className="text-center p-8 text-slate-500 font-medium">
              Nenhum dado encontrado na planilha.
            </div>
          ) : (
            <div className="space-y-6">
              {/* FILTERS & METRIC */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden px-4 py-2 flex items-center shadow-sm">
                    <input
                      type="text"
                      placeholder="Filtrar por Produto..."
                      className="w-full text-sm font-medium outline-none bg-transparent text-slate-700 placeholder-slate-400"
                      value={dashboardFilters.produtoDesc}
                      onChange={(e) =>
                        setDashboardFilters({
                          ...dashboardFilters,
                          produtoDesc: e.target.value,
                        })
                      }
                    />
                    {dashboardFilters.produtoDesc && (
                      <button
                        onClick={() =>
                          setDashboardFilters({
                            ...dashboardFilters,
                            produtoDesc: "",
                          })
                        }
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="w-[180px] bg-white rounded-xl border border-slate-200 overflow-hidden relative shadow-sm shrink-0">
                      <select
                        value={rankingMetric}
                        onChange={(e) =>
                          setRankingMetric(e.target.value as any)
                        }
                        className="w-full h-10 px-3 pl-4 appearance-none bg-transparent outline-none text-sm font-semibold text-slate-700"
                      >
                        <option value="media">Média Geral</option>
                        <option value="dias30">30 Dias</option>
                        <option value="dias60">60 Dias</option>
                        <option value="dias90">90 Dias</option>
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3 top-3 text-slate-400 pointer-events-none"
                      />
                    </div>

                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`h-10 px-4 rounded-xl shadow-sm border flex items-center justify-center transition-colors shrink-0 ${showFilters || dashboardFilters.usina.length > 0 || dashboardFilters.modalidade.length > 0 || dashboardFilters.operacao.length > 0 ? "bg-[#8C181E] text-white border-[#8C181E]" : "bg-white border-slate-200 text-slate-600"}`}
                    >
                      <Filter size={18} />
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-sm font-bold text-slate-800">
                        Filtros Ocultos
                      </h3>
                      {(dashboardFilters.usina.length > 0 ||
                        dashboardFilters.modalidade.length > 0 ||
                        dashboardFilters.operacao.length > 0) && (
                        <button
                          onClick={() =>
                            setDashboardFilters({
                              usina: [],
                              modalidade: [],
                              operacao: [],
                              produtoDesc: dashboardFilters.produtoDesc,
                            })
                          }
                          className="text-xs text-red-600 font-medium flex items-center"
                        >
                          Limpar Filtros
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-2 block">
                          Usina
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {uniqueUsinas.map((u: any) => (
                            <button
                              key={u}
                              onClick={() => toggleFilter("usina", u)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${dashboardFilters.usina.includes(u) ? "bg-[#8C181E] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            >
                              {u}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-2 block">
                          Modalidade
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {uniqueModalidades.map((m: any) => (
                            <button
                              key={m}
                              onClick={() => toggleFilter("modalidade", m)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${dashboardFilters.modalidade.includes(m) ? "bg-[#8C181E] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-2 block">
                          Operação
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {uniqueOperacoes.map((o: any) => (
                            <button
                              key={o}
                              onClick={() => toggleFilter("operacao", o)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${dashboardFilters.operacao.includes(o) ? "bg-[#8C181E] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* TOP SECTION: 3 COLUMNS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <TopChartCard
                  title="30 Dias"
                  dataKey="dias30"
                  data={dashboardRanking}
                  color="#059669"
                />
                <TopChartCard
                  title="60 Dias"
                  dataKey="dias60"
                  data={dashboardRanking}
                  color="#2563EB"
                />
                <TopChartCard
                  title="90 Dias"
                  dataKey="dias90"
                  data={dashboardRanking}
                  color="#D97706"
                />
              </div>

              {dashboardRanking.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-100 text-slate-500 text-sm">
                  Nenhum resultado para os filtros selecionados.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* MAIN CHART */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col h-[500px]">
                    <h2 className="text-center font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">
                      Top{" "}
                      {rankingMetric === "media"
                        ? "Médias"
                        : rankingMetric.replace("dias", "") + " Dias"}{" "}
                      por Produto
                    </h2>
                    <div className="flex-1 w-full min-h-0 pl-1 pr-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={dashboardRanking.slice(0, 10)}
                          margin={{ top: 30, right: 20, left: 10, bottom: 20 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#E2E8F0"
                          />
                          <XAxis
                            dataKey="name"
                            type="category"
                            tick={{ fontSize: 10, fill: "#64748B" }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            angle={-60}
                            textAnchor="end"
                            height={160}
                            tickFormatter={(val: string) =>
                              val.length > 30
                                ? val.substring(0, 27) + "..."
                                : val
                            }
                          />
                          <YAxis
                            hide
                            type="number"
                            domain={["auto", "auto"]}
                            padding={{ top: 20, bottom: 20 }}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                            formatter={(value: any, name: string) => [
                              `${value}`,
                              name === "valor" || name === "media"
                                ? "Média"
                                : name,
                            ]}
                          />
                          {rankingMetric === "media" ? (
                            <>
                              <Legend
                                verticalAlign="top"
                                height={40}
                                wrapperStyle={{
                                  fontSize: "11px",
                                  fontWeight: "600",
                                }}
                              />
                              <Bar
                                dataKey="media"
                                name="Média Geral"
                                fill="#2196F3"
                                radius={[6, 6, 0, 0]}
                                barSize={40}
                                fillOpacity={0.9}
                              >
                                <LabelList
                                  dataKey="media"
                                  position="top"
                                  style={{
                                    fontSize: "11px",
                                    fill: "#2196F3",
                                    fontWeight: "bold",
                                  }}
                                  formatter={(val: number) => val.toFixed(1)}
                                  offset={10}
                                />
                              </Bar>
                              <Line
                                type="monotone"
                                dataKey="dias30"
                                name="30 Dias"
                                stroke="#10B981"
                                strokeWidth={3}
                                dot={{ fill: "#10B981", r: 4, strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="dias60"
                                name="60 Dias"
                                stroke="#3B82F6"
                                strokeWidth={3}
                                dot={{ fill: "#3B82F6", r: 4, strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="dias90"
                                name="90 Dias"
                                stroke="#F59E0B"
                                strokeWidth={3}
                                dot={{ fill: "#F59E0B", r: 4, strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                              />
                            </>
                          ) : (
                            <Bar
                              dataKey="valor"
                              name="Valor"
                              fill="#2196F3"
                              radius={[6, 6, 0, 0]}
                              barSize={40}
                              fillOpacity={0.9}
                            >
                              <LabelList
                                dataKey="valor"
                                position="top"
                                style={{
                                  fontSize: "11px",
                                  fill: "#2196F3",
                                  fontWeight: "bold",
                                }}
                                formatter={(val: number) => val.toFixed(1)}
                                offset={10}
                              />
                            </Bar>
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* BOTTOM GRIDS */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Data Table */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col h-[350px]">
                      <h2 className="font-bold text-slate-800 mb-2 text-sm uppercase tracking-wider">
                        Desempenho por Produto
                      </h2>
                      <div className="overflow-y-auto w-full flex-1 pr-1 custom-scrollbar">
                        <table className="w-full text-left text-xs min-w-[300px]">
                          <thead className="sticky top-0 bg-white/90 backdrop-blur pb-2 z-10 text-slate-400">
                            <tr>
                              <th className="font-semibold py-2 w-[40%]">
                                Produto
                              </th>
                              <th className="font-semibold py-2">Dose</th>
                              <th className="font-semibold py-2 w-[40%] text-right pr-2">
                                Média
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {dashboardRanking.map((item) => (
                              <tr key={item.id}>
                                <td
                                  className="py-3 font-semibold text-slate-700 truncate max-w-[120px]"
                                  title={item.name}
                                >
                                  {item.name}
                                </td>
                                <td className="py-3 text-slate-500 font-medium">
                                  {item.dose}
                                </td>
                                <td className="py-3 pr-2">
                                  <div className="flex items-center gap-2 justify-end">
                                    <span className="font-bold text-slate-700">
                                      {item.media}
                                    </span>
                                    <div className="h-4 w-16 bg-slate-100 rounded-sm overflow-hidden flex">
                                      <div
                                        className="h-full bg-[#8C181E]"
                                        style={{
                                          width: `${Math.min(100, (item.media / (kpis.media.best.media || 1)) * 100)}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  if (currentView === "settings") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        <header className="bg-[#8C181E] text-white p-4 shadow-md sticky top-0 z-10 flex items-center">
          <button
            onClick={() => setCurrentView("home")}
            className="p-2 mr-3 rounded-full hover:bg-black/10 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg leading-tight tracking-wide">
              Configurações
            </h1>
          </div>
        </header>

        <main className="max-w-xl mx-auto w-full p-4 pt-6 space-y-6 flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6 space-y-6">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Settings size={48} className="text-[#8C181E]" />
              <h2 className="text-2xl font-bold text-center">URL do Web App</h2>
              <p className="text-center text-sm text-slate-500">
                Cole a URL do seu Google Apps Script para receber os dados na
                planilha.
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="url"
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-[#8C181E] focus:ring-4 focus:ring-[#8C181E]/20 transition-all outline-none"
              />
            </div>

            <button
              onClick={saveScriptUrl}
              className="w-full bg-[#8C181E] hover:bg-[#A81D24] text-white font-bold p-4 rounded-xl text-lg flex items-center justify-center space-x-2 transition-colors active:scale-95"
            >
              <span>Salvar URL</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // default to form view (currentView === 'form')
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-[100px] animate-in fade-in duration-500">
      {/* Header */}
      <header className="bg-[#8C181E] text-white p-4 shadow-md sticky top-0 z-10 flex items-center">
        <button
          onClick={() => setCurrentView("home")}
          className="p-2 mr-3 rounded-full hover:bg-black/10 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg leading-tight tracking-wide">
            Novo Cadastro
          </h1>
          <p className="text-red-100/80 text-xs font-medium">Novo Registro</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto p-4 pt-6 space-y-6">
        {/* Success Alert */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-4 rounded-2xl shadow-sm flex items-start flex-col animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center space-x-3 w-full">
              <CheckCircle className="text-green-600 flex-shrink-0" size={28} />
              <div>
                <h3 className="font-bold text-lg">Enviado com sucesso!</h3>
                <p className="text-sm opacity-90">
                  Os dados foram registrados na planilha.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-4 rounded-2xl flex items-center space-x-3 mb-6">
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
        >
          {/* 1. Usina */}
          <div className="space-y-1.5">
            <label
              htmlFor="usina"
              className="block text-sm font-semibold text-slate-700"
            >
              1. Usina
            </label>
            <input
              id="usina"
              name="usina"
              type="text"
              required
              value={formData.usina}
              onChange={handleInputChange}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#8C181E] focus:ring-4 focus:ring-[#8C181E]/10 outline-none transition-all text-lg"
              placeholder="Nome da Usina"
            />
          </div>

          {/* 2. Talhão */}
          <div className="space-y-1.5">
            <label
              htmlFor="talhao"
              className="block text-sm font-semibold text-slate-700"
            >
              2. Talhão
            </label>
            <input
              id="talhao"
              name="talhao"
              type="text"
              required
              value={formData.talhao}
              onChange={handleInputChange}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#8C181E] focus:ring-4 focus:ring-[#8C181E]/10 outline-none transition-all text-lg"
              placeholder="Nº ou Identificador"
            />
          </div>

          {/* 3. Produtos */}
          <div className="space-y-1.5">
            <label
              htmlFor="produtos"
              className="block text-sm font-semibold text-slate-700"
            >
              3. Produtos
            </label>
            <input
              id="produtos"
              name="produtos"
              type="text"
              required
              value={formData.produtos}
              onChange={handleInputChange}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#8C181E] focus:ring-4 focus:ring-[#8C181E]/10 outline-none transition-all text-lg"
              placeholder="Ex: Maturador A + Adjuvante B"
            />
          </div>

          {/* 4. Dose */}
          <div className="space-y-1.5">
            <label
              htmlFor="dose"
              className="block text-sm font-semibold text-slate-700"
            >
              4. Dose
            </label>
            <input
              id="dose"
              name="dose"
              type="text"
              required
              value={formData.dose}
              onChange={handleInputChange}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#8C181E] focus:ring-4 focus:ring-[#8C181E]/10 outline-none transition-all text-lg"
              placeholder="Quantidade por hectare (Ex: 0.5)"
            />
          </div>

          {/* Dias Grid */}
          <div className="pt-2 pb-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 text-center border-b border-slate-200 pb-2">
              Dias (Informações)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* 5. 30 Dias */}
              <div className="space-y-1.5">
                <label
                  htmlFor="dias30"
                  className="block text-xs font-semibold text-slate-600"
                >
                  5. 30 Dias
                </label>
                <input
                  id="dias30"
                  name="dias30"
                  type="number"
                  step="any"
                  value={formData.dias30}
                  onChange={handleInputChange}
                  className="w-full p-3 text-center bg-white border border-slate-200 rounded-xl focus:border-[#8C181E] focus:ring-4 focus:ring-[#8C181E]/10 outline-none transition-all text-lg block"
                  placeholder="0.0"
                />
              </div>

              {/* 6. 60 Dias */}
              <div className="space-y-1.5">
                <label
                  htmlFor="dias60"
                  className="block text-xs font-semibold text-slate-600"
                >
                  6. 60 Dias
                </label>
                <input
                  id="dias60"
                  name="dias60"
                  type="number"
                  step="any"
                  value={formData.dias60}
                  onChange={handleInputChange}
                  className="w-full p-3 text-center bg-white border border-slate-200 rounded-xl focus:border-[#8C181E] focus:ring-4 focus:ring-[#8C181E]/10 outline-none transition-all text-lg block"
                  placeholder="0.0"
                />
              </div>

              {/* 7. 90 Dias */}
              <div className="space-y-1.5">
                <label
                  htmlFor="dias90"
                  className="block text-xs font-semibold text-slate-600"
                >
                  7. 90 Dias
                </label>
                <input
                  id="dias90"
                  name="dias90"
                  type="number"
                  step="any"
                  value={formData.dias90}
                  onChange={handleInputChange}
                  className="w-full p-3 text-center bg-white border border-slate-200 rounded-xl focus:border-[#8C181E] focus:ring-4 focus:ring-[#8C181E]/10 outline-none transition-all text-lg block"
                  placeholder="0.0"
                />
              </div>
            </div>

            {/* 9. Média */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">
                9. Média (Calculada)
              </label>
              <div className="text-2xl font-bold text-[#8C181E] w-24 text-right bg-red-50 py-1 px-3 rounded-lg">
                {mediaVal() || "-"}
              </div>
            </div>
          </div>

          {/* 10. Modalidade */}
          <div className="space-y-1.5">
            <label
              htmlFor="modalidade"
              className="block text-sm font-semibold text-slate-700"
            >
              10. Modalidade
            </label>
            <input
              id="modalidade"
              name="modalidade"
              type="text"
              required
              value={formData.modalidade}
              onChange={handleInputChange}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#8C181E] focus:ring-4 focus:ring-[#8C181E]/10 outline-none transition-all text-lg"
              placeholder="Digite a Modalidade"
            />
          </div>

          {/* 11. Operação */}
          <div className="space-y-1.5">
            <label
              htmlFor="operacao"
              className="block text-sm font-semibold text-slate-700"
            >
              11. Operação
            </label>
            <input
              id="operacao"
              name="operacao"
              type="text"
              required
              value={formData.operacao}
              onChange={handleInputChange}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#8C181E] focus:ring-4 focus:ring-[#8C181E]/10 outline-none transition-all text-lg"
              placeholder="Digite a Operação"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#8C181E] hover:bg-[#721217] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 text-white font-bold py-5 rounded-2xl shadow-lg shadow-red-900/20 text-xl flex items-center justify-center space-x-3 transition-all"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send size={24} />
                  <span>Enviar Dados</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

import {
  Search,
  RotateCcw,
  Filter,
  MapPin,
  Globe,
  GraduationCap,
  Clock,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConcursoFilterState } from "@/types/concurso";

export interface ConcursoFilterBarProps {
  filters: ConcursoFilterState;
  onFilterChange: (filters: ConcursoFilterState) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
}

const BRAZILIAN_STATES = [
  { value: "all", label: "Todas as UFs" },
  { value: "BR", label: "Nacional (BR)" },
  { value: "AC", label: "Acre (AC)" },
  { value: "AL", label: "Alagoas (AL)" },
  { value: "AP", label: "Amapá (AP)" },
  { value: "AM", label: "Amazonas (AM)" },
  { value: "BA", label: "Bahia (BA)" },
  { value: "CE", label: "Ceará (CE)" },
  { value: "DF", label: "Distrito Federal (DF)" },
  { value: "ES", label: "Espírito Santo (ES)" },
  { value: "GO", label: "Goiás (GO)" },
  { value: "MA", label: "Maranhão (MA)" },
  { value: "MT", label: "Mato Grosso (MT)" },
  { value: "MS", label: "Mato Grosso do Sul (MS)" },
  { value: "MG", label: "Minas Gerais (MG)" },
  { value: "PA", label: "Pará (PA)" },
  { value: "PB", label: "Paraíba (PB)" },
  { value: "PR", label: "Paraná (PR)" },
  { value: "PE", label: "Pernambuco (PE)" },
  { value: "PI", label: "Piauí (PI)" },
  { value: "RJ", label: "Rio de Janeiro (RJ)" },
  { value: "RN", label: "Rio Grande do Norte (RN)" },
  { value: "RS", label: "Rio Grande do Sul (RS)" },
  { value: "RO", label: "Rondônia (RO)" },
  { value: "RR", label: "Roraima (RR)" },
  { value: "SC", label: "Santa Catarina (SC)" },
  { value: "SP", label: "São Paulo (SP)" },
  { value: "SE", label: "Sergipe (SE)" },
  { value: "TO", label: "Tocantins (TO)" },
];

const SPHERE_OPTIONS = [
  { value: "all", label: "Todas as Esferas" },
  { value: "federal", label: "Federal" },
  { value: "estadual", label: "Estadual" },
  { value: "municipal", label: "Municipal" },
];

const EDUCATION_OPTIONS = [
  { value: "all", label: "Todos os Níveis" },
  { value: "superior", label: "Nível Superior" },
  { value: "medio", label: "Nível Médio" },
  { value: "tecnico", label: "Nível Técnico" },
  { value: "fundamental", label: "Nível Fundamental" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os Status" },
  { value: "inscricoes_abertas", label: "Inscrições Abertas" },
  { value: "edital_publicado", label: "Edital Publicado" },
  { value: "autorizado", label: "Autorizado" },
  { value: "previsto", label: "Previsto" },
  { value: "encerrado", label: "Encerrado" },
];

const EXAM_DATE_OPTIONS = [
  { value: "all", label: "Todas as Datas" },
  { value: "30_days", label: "Próximos 30 dias" },
  { value: "60_days", label: "Próximos 60 dias" },
  { value: "90_days", label: "Próximos 90 dias" },
  { value: "year_2026", label: "Ano de 2026" },
  { value: "tbd", label: "A definir" },
];

export function ConcursoFilterBar({
  filters,
  onFilterChange,
  onReset,
  totalCount,
  filteredCount,
}: ConcursoFilterBarProps) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.sphere !== "all" ||
    filters.state !== "all" ||
    filters.education_level !== "all" ||
    filters.status !== "all" ||
    (Boolean(filters.exam_date_range) && filters.exam_date_range !== "all");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      search: e.target.value,
    });
  };

  const handleSelectChange = (field: keyof ConcursoFilterState, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className="w-full space-y-4 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 sm:p-5 shadow-sm">
      {/* Header Row: Title & Counter */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
          <Filter className="w-4 h-4 text-primary" />
          <span>Filtros do Catálogo de Concursos</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant font-medium">
            Mostrando <strong className="text-primary">{filteredCount}</strong> de{" "}
            <strong>{totalCount}</strong> certames
          </span>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-7 px-2 text-xs text-secondary hover:text-secondary hover:bg-secondary/10 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* 1. Search text input */}
        <div className="relative sm:col-span-2 lg:col-span-1 xl:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          <Input
            placeholder="Buscar por órgão, cargo, banca..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-9 h-10 bg-surface-container border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/60 focus-visible:ring-primary text-xs sm:text-sm"
          />
        </div>

        {/* 2. State / UF Select */}
        <div>
          <Select value={filters.state} onValueChange={(val) => handleSelectChange("state", val)}>
            <SelectTrigger
              aria-label="Filtrar por Estado / UF"
              className="h-10 bg-surface-container border-outline-variant/30 text-on-surface text-xs sm:text-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <MapPin className="w-3.5 h-3.5 text-secondary shrink-0" />
                <SelectValue placeholder="Todas as UFs" />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-64 bg-surface-container border-outline-variant/30 text-on-surface">
              {BRAZILIAN_STATES.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3. Sphere Select */}
        <div>
          <Select value={filters.sphere} onValueChange={(val) => handleSelectChange("sphere", val)}>
            <SelectTrigger
              aria-label="Filtrar por Esfera"
              className="h-10 bg-surface-container border-outline-variant/30 text-on-surface text-xs sm:text-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                <SelectValue placeholder="Todas as Esferas" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-surface-container border-outline-variant/30 text-on-surface">
              {SPHERE_OPTIONS.map((sphere) => (
                <SelectItem key={sphere.value} value={sphere.value}>
                  {sphere.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 4. Education Level Select */}
        <div>
          <Select
            value={filters.education_level}
            onValueChange={(val) => handleSelectChange("education_level", val)}
          >
            <SelectTrigger
              aria-label="Filtrar por Escolaridade"
              className="h-10 bg-surface-container border-outline-variant/30 text-on-surface text-xs sm:text-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <GraduationCap className="w-3.5 h-3.5 text-tertiary shrink-0" />
                <SelectValue placeholder="Todos os Níveis" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-surface-container border-outline-variant/30 text-on-surface">
              {EDUCATION_OPTIONS.map((edu) => (
                <SelectItem key={edu.value} value={edu.value}>
                  {edu.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 5. Status Select */}
        <div>
          <Select value={filters.status} onValueChange={(val) => handleSelectChange("status", val)}>
            <SelectTrigger
              aria-label="Filtrar por Status"
              className="h-10 bg-surface-container border-outline-variant/30 text-on-surface text-xs sm:text-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <SelectValue placeholder="Todos os Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-surface-container border-outline-variant/30 text-on-surface">
              {STATUS_OPTIONS.map((st) => (
                <SelectItem key={st.value} value={st.value}>
                  {st.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 6. Exam Date Range Select */}
        <div>
          <Select
            value={filters.exam_date_range || "all"}
            onValueChange={(val) => handleSelectChange("exam_date_range", val)}
          >
            <SelectTrigger
              aria-label="Filtrar por Data da Prova"
              className="h-10 bg-surface-container border-outline-variant/30 text-on-surface text-xs sm:text-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <SelectValue placeholder="Todas as Datas" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-surface-container border-outline-variant/30 text-on-surface">
              {EXAM_DATE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

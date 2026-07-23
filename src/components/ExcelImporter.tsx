import React, { useState } from 'react';
import { Upload, Clipboard, Check, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product } from '../types';

interface ExcelImporterProps {
  onImport: (newProducts: Product[]) => void;
}

export default function ExcelImporter({ onImport }: ExcelImporterProps) {
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState<Product[]>([]);
  const [error, setError] = useState('');

  const normalizeStatusToActive = (statusValue: string): boolean => {
    const normalized = statusValue.trim().toLowerCase();
    return !(
      normalized === 'inativo' ||
      normalized === 'inativa' ||
      normalized === 'false' ||
      normalized === '0' ||
      normalized === 'nao' ||
      normalized === 'não'
    );
  };

  const parseRows = (rows: string[][]) => {
    if (rows.length < 2) {
      throw new Error('O arquivo ou texto colado deve conter pelo menos uma linha de cabeçalho e uma de dados.');
    }

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const indexMap = {
      id: headers.findIndex(h => h === 'código/id' || h === 'codigo/id' || h === 'código' || h === 'codigo' || h === 'id'),
      name: headers.findIndex(h => h === 'nome do produto' || h === 'produto' || h === 'nome'),
      category: headers.findIndex(h => h === 'categoria'),
      supplier: headers.findIndex(h => h === 'fornecedor'),
      minStock: headers.findIndex(h => h === 'estoque necessário' || h === 'estoque necessario'),
      unit: headers.findIndex(h => h === 'unidade' || h === 'un'),
      status: headers.findIndex(h => h === 'status')
    };

    const requiredFields: Array<keyof typeof indexMap> = ['id', 'name', 'category', 'supplier', 'minStock', 'unit', 'status'];
    const missing = requiredFields.filter((field) => indexMap[field] === -1);
    if (missing.length > 0) {
      throw new Error('Cabeçalho inválido. Use exatamente as colunas: Código/ID, Nome do Produto, Categoria, Fornecedor, Estoque Necessário, Unidade, Status.');
    }

    const products: Product[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const id = String(row[indexMap.id] || '').trim();
      const name = String(row[indexMap.name] || '').trim();
      const category = String(row[indexMap.category] || '').trim();
      const supplier = String(row[indexMap.supplier] || '').trim();
      const unit = String(row[indexMap.unit] || '').trim();
      const status = String(row[indexMap.status] || '').trim();
      const minStockRaw = String(row[indexMap.minStock] || '').trim();
      const minStock = parseInt(minStockRaw.replace(/[^\d]/g, ''), 10) || 0;

      if (!id || !name || !category || !supplier || !unit || !status) continue;

      products.push({
        id,
        name,
        category,
        supplier,
        minStock,
        unit,
        active: normalizeStatusToActive(status)
      });
    }

    if (products.length === 0) {
      throw new Error('Nenhum produto válido encontrado para importação.');
    }

    return products;
  };

  // Process CSV/TSV text
  const parseData = (text: string) => {
    try {
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      // Detect delimiter (tab or comma or semicolon)
      const headerLine = lines[0];
      let delimiter = ',';
      if (headerLine.includes('\t')) delimiter = '\t';
      else if (headerLine.includes(';')) delimiter = ';';

      const rows = lines.map((line) => line.split(delimiter).map((cell) => cell.trim()));
      const products = parseRows(rows);
      setPreviewData(products);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar dados. Verifique a formatação.');
      setPreviewData([]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to raw array of arrays
        const rawRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, { header: 1 });
        const rows = rawRows.map((row) => row.map((cell) => String(cell ?? '').trim()));
        const products = parseRows(rows);
        setPreviewData(products);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao processar arquivo. Verifique a formatação.');
        setPreviewData([]);
      }
    };
    reader.onerror = () => {
      setError('Erro ao ler o arquivo.');
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPasteText(val);
    if (val) {
      parseData(val);
    } else {
      setPreviewData([]);
    }
  };

  const executeImport = () => {
    if (previewData.length > 0) {
      onImport(previewData);
      // Reset state
      setPreviewData([]);
      setPasteText('');
      setFileName('');
      setPasteMode(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs max-w-2xl mx-auto" id="excel-importer-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-medium text-lg text-slate-800" id="excel-importer-title">
            Importar de Planilha (Excel/CSV)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Ao confirmar, a importação substitui toda a base atual de produtos.
          </p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5" id="import-mode-tabs">
          <button
            type="button"
            onClick={() => { setPasteMode(false); setError(''); setPreviewData([]); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!pasteMode ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            id="btn-mode-file"
          >
            <Upload className="w-3 h-3 inline mr-1.5" />
            Arquivo Planilha
          </button>
          <button
            type="button"
            onClick={() => { setPasteMode(true); setError(''); setPreviewData([]); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${pasteMode ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            id="btn-mode-paste"
          >
            <Clipboard className="w-3 h-3 inline mr-1.5" />
            Copiar e Colar
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-xl mb-4 text-xs" id="importer-error-alert">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {!pasteMode ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer flex flex-col items-center justify-center ${
            dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
          id="dropzone-container"
          onClick={() => document.getElementById('csv-file-input')?.click()}
        >
          <input
            id="csv-file-input"
            type="file"
            accept=".csv, .xls, .xlsx, .txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="p-3 bg-indigo-50 rounded-full text-indigo-600 mb-3" id="dropzone-icon">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            {fileName ? `Selecionado: ${fileName}` : 'Arraste seu arquivo Excel (.xls, .xlsx) ou CSV aqui ou clique para buscar'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Suporta os formatos .xls, .xlsx, .csv e .txt.
          </p>
        </div>
      ) : (
        <div className="space-y-2" id="paste-mode-container">
          <label htmlFor="paste-area" className="text-xs font-medium text-slate-600 block">
            Cole as colunas do Excel diretamente aqui (incluindo a linha de cabeçalho)
          </label>
          <textarea
            id="paste-area"
            value={pasteText}
            onChange={handlePasteChange}
            placeholder="Código/ID&#9;Nome do Produto&#9;Categoria&#9;Fornecedor&#9;Estoque Necessário&#9;Unidade&#9;Status&#10;1001&#9;Coca Cola 2L&#9;Bebidas&#9;Coca-Cola&#9;10&#9;un&#9;Ativo"
            className="w-full h-36 p-3 text-xs font-mono border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
          />
        </div>
      )}

      {previewData.length > 0 && (
        <div className="mt-5 space-y-3" id="importer-preview-container">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-medium text-slate-700">
              Pré-visualização da Importação ({previewData.length} {previewData.length === 1 ? 'produto' : 'produtos'})
            </span>
            <button
              type="button"
              onClick={() => { setPreviewData([]); setPasteText(''); setFileName(''); }}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium"
              id="btn-cancel-import"
            >
              Cancelar
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl" id="preview-list">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 sticky top-0">
                  <th className="p-2.5 font-medium">Produto</th>
                  <th className="p-2.5 font-medium text-center">Necessário</th>
                  <th className="p-2.5 font-medium">Categoria</th>
                  <th className="p-2.5 font-medium">Fornecedor</th>
                  <th className="p-2.5 font-medium text-center">Unidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {previewData.slice(0, 10).map((prod, index) => (
                  <tr key={index} className="hover:bg-slate-50 text-slate-600">
                    <td className="p-2.5 font-medium text-slate-800">{prod.name}</td>
                    <td className="p-2.5 text-center font-mono font-medium text-indigo-600">{prod.minStock}</td>
                    <td className="p-2.5">{prod.category}</td>
                    <td className="p-2.5">{prod.supplier}</td>
                    <td className="p-2.5 text-center text-slate-500">{prod.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 10 && (
              <div className="p-2 text-center text-[10px] text-slate-400 bg-slate-50/50 border-t border-slate-100">
                E mais {previewData.length - 10} produtos...
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-2" id="import-actions">
            <button
              type="button"
              onClick={executeImport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-medium text-xs shadow-sm transition-colors cursor-pointer"
              id="btn-confirm-import"
            >
              <Check className="w-3.5 h-3.5" />
              Confirmar Importação de {previewData.length} {previewData.length === 1 ? 'Item' : 'Itens'}
            </button>
          </div>
        </div>
      )}

      {!previewData.length && (
        <div className="mt-4 bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 leading-relaxed" id="import-instructions">
          <p className="font-medium text-slate-700 mb-1">Como deve ser seu arquivo ou dados copiados:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Deve ter uma linha de cabeçalho no topo.</li>
            <li>Colunas obrigatórias: <code className="bg-slate-200/60 px-1 py-0.5 rounded text-indigo-600 font-mono">Código/ID</code>, <code className="bg-slate-200/60 px-1 py-0.5 rounded text-indigo-600 font-mono">Nome do Produto</code>, <code className="bg-slate-200/60 px-1 py-0.5 rounded text-indigo-600 font-mono">Categoria</code>, <code className="bg-slate-200/60 px-1 py-0.5 rounded text-indigo-600 font-mono">Fornecedor</code>, <code className="bg-slate-200/60 px-1 py-0.5 rounded text-indigo-600 font-mono">Estoque Necessário</code>, <code className="bg-slate-200/60 px-1 py-0.5 rounded text-indigo-600 font-mono">Unidade</code> e <code className="bg-slate-200/60 px-1 py-0.5 rounded text-indigo-600 font-mono">Status</code>.</li>
            <li>Você pode simplesmente copiar uma tabela selecionada no Excel e colar no modo "Copiar e Colar".</li>
          </ul>
        </div>
      )}
    </div>
  );
}

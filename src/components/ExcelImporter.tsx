import React, { useState } from 'react';
import { Upload, Clipboard, Check, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product } from '../types';

interface ExcelImporterProps {
  onImport: (newProducts: Omit<Product, 'id'>[]) => void;
}

export default function ExcelImporter({ onImport }: ExcelImporterProps) {
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState<Omit<Product, 'id'>[]>([]);
  const [error, setError] = useState('');

  // Process CSV/TSV text
  const parseData = (text: string) => {
    try {
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        throw new Error('O arquivo ou texto colado deve conter pelo menos uma linha de cabeçalho e uma de dados.');
      }

      // Detect delimiter (tab or comma or semicolon)
      const headerLine = lines[0];
      let delimiter = ',';
      if (headerLine.includes('\t')) delimiter = '\t';
      else if (headerLine.includes(';')) delimiter = ';';

      const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase());
      
      // Map expected header synonyms
      // Expected fields: Produto, Quantidade Necessária, Categoria, Fornecedor, Unidade
      const indexMap = {
        name: headers.findIndex(h => h === 'produto' || h === 'nome' || h.includes('prod')),
        minStock: headers.findIndex(h => h === 'quantidade necessária' || h === 'quantidade necessaria' || h === 'qtd' || h.includes('necess') || h.includes('min') || h.includes('estoq')),
        category: headers.findIndex(h => h === 'categoria' || h.includes('categ')),
        supplier: headers.findIndex(h => h === 'fornecedor' || h.includes('fornec')),
        unit: headers.findIndex(h => h === 'unidade' || h === 'un' || h.includes('unid'))
      };

      if (indexMap.name === -1 || indexMap.minStock === -1) {
        throw new Error(
          'Não foi possível encontrar as colunas obrigatórias. Certifique-se de ter cabeçalhos como: "Produto" e "Quantidade Necessária".'
        );
      }

      const products: Omit<Product, 'id'>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(delimiter);
        if (row.length < 2) continue;

        const name = row[indexMap.name]?.trim() || '';
        const minStockStr = row[indexMap.minStock]?.trim() || '0';
        // Remove formatting from numbers (e.g., Brazilian 1.000 or currency)
        const cleanMinStock = minStockStr.replace(/[^\d]/g, '');
        const minStock = parseInt(cleanMinStock, 10) || 0;

        const category = indexMap.category !== -1 ? row[indexMap.category]?.trim() || 'Outros' : 'Outros';
        const supplier = indexMap.supplier !== -1 ? row[indexMap.supplier]?.trim() || 'Outros' : 'Outros';
        const unit = indexMap.unit !== -1 ? row[indexMap.unit]?.trim() || 'un' : 'un';

        if (name) {
          products.push({
            name,
            minStock,
            supplier: supplier || 'Outros',
            category: category || 'Outros',
            unit: unit || 'un'
          });
        }
      }

      if (products.length === 0) {
        throw new Error('Nenhum produto válido encontrado para importação.');
      }

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
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        
        if (rawRows.length < 2) {
          throw new Error('O arquivo deve conter pelo menos uma linha de cabeçalho e uma de dados.');
        }

        // Map headers
        const headers = rawRows[0].map((h: any) => String(h || '').trim().toLowerCase());

        const indexMap = {
          name: headers.findIndex(h => h === 'produto' || h === 'nome' || h.includes('prod')),
          minStock: headers.findIndex(h => h === 'quantidade necessária' || h === 'quantidade necessaria' || h === 'qtd' || h.includes('necess') || h.includes('min') || h.includes('estoq')),
          category: headers.findIndex(h => h === 'categoria' || h.includes('categ')),
          supplier: headers.findIndex(h => h === 'fornecedor' || h.includes('fornec')),
          unit: headers.findIndex(h => h === 'unidade' || h === 'un' || h.includes('unid'))
        };

        if (indexMap.name === -1 || indexMap.minStock === -1) {
          throw new Error(
            'Não foi possível encontrar as colunas obrigatórias. Certifique-se de ter cabeçalhos como: "Produto" e "Quantidade Necessária".'
          );
        }

        const products: Omit<Product, 'id'>[] = [];

        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;

          const name = String(row[indexMap.name] || '').trim();
          if (!name) continue;

          const minStockVal = row[indexMap.minStock];
          let minStock = 0;
          if (typeof minStockVal === 'number') {
            minStock = minStockVal;
          } else {
            const cleanMinStock = String(minStockVal || '').replace(/[^\d]/g, '');
            minStock = parseInt(cleanMinStock, 10) || 0;
          }

          const category = indexMap.category !== -1 ? String(row[indexMap.category] || '').trim() || 'Outros' : 'Outros';
          const supplier = indexMap.supplier !== -1 ? String(row[indexMap.supplier] || '').trim() || 'Outros' : 'Outros';
          const unit = indexMap.unit !== -1 ? String(row[indexMap.unit] || '').trim() || 'un' : 'un';

          products.push({
            name,
            minStock,
            category,
            supplier,
            unit
          });
        }

        if (products.length === 0) {
          throw new Error('Nenhum produto válido encontrado para importação.');
        }

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
            Importe sua lista de estoque necessário com rapidez.
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
            placeholder="Produto&#9;Quantidade Necessária&#9;Categoria&#9;Fornecedor&#9;Unidade&#10;Coca Cola 2l&#9;10&#9;Bebidas&#9;Coca-Cola&#9;un&#10;Cerveja Lata&#9;24&#9;Bebidas&#9;Ambev&#9;un"
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
            <li>Colunas recomendadas: <code className="bg-slate-200/60 px-1 py-0.5 rounded text-indigo-600 font-mono">Produto</code>, <code className="bg-slate-200/60 px-1 py-0.5 rounded text-indigo-600 font-mono">Quantidade Necessária</code>, <code className="bg-slate-200/60 px-1 py-0.5 rounded text-indigo-600 font-mono">Categoria</code>, <code className="bg-slate-200/60 px-1 py-0.5 rounded text-indigo-600 font-mono">Fornecedor</code>, <code className="bg-slate-200/60 px-1 py-0.5 rounded text-indigo-600 font-mono">Unidade</code>.</li>
            <li>Você pode simplesmente copiar uma tabela selecionada no Excel e colar no modo "Copiar e Colar".</li>
          </ul>
        </div>
      )}
    </div>
  );
}

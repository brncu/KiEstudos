import fs from 'fs';

const file = 'E:\\Concurso_Workspace\\src\\routes\\configuracoes.tsx';
let data = fs.readFileSync(file, 'utf8');

// Replace mock strings with empty or zero values
data = data.replace(/Auditor VIP/g, '');
data = data.replace(/#KI-9942/g, '');
data = data.replace(/CEO KiEstudos/g, '');
data = data.replace(/ceokiestudos/g, '');
data = data.replace(/ceo@kiestudos.com/g, '');
data = data.replace(/\+55 \(11\) 98822-4411/g, '');
data = data.replace(/Auditor Fiscal da Receita Federal \(AFRFB\)/g, '');
data = data.replace(/04h 30m/g, '00h 00m');
data = data.replace(/82\.400 \/ 150\.000 tokens de IA/g, '0 / 0 tokens de IA');
data = data.replace(/54\.9% Consumido • Renova em 10 dias/g, '0% Consumido');
data = data.replace(/width: "55%"/g, 'width: "0%"');
data = data.replace(/42 Redações corrigidas \+ 310 Resumos de Jurisprudência/g, '0 Redações corrigidas + 0 Resumos de Jurisprudência');
data = data.replace(/Top 1% Simulados/g, 'Sem ranking');
data = data.replace(/1\.480 flashcards/g, '0 flashcards');
data = data.replace(/MacBook Pro 16" \(Chrome 124\)/g, 'Dispositivo Desconhecido');
data = data.replace(/São Paulo, Brasil • IP 177\.18\.92\.10/g, 'Localização Desconhecida');
data = data.replace(/iPad Pro 12\.9" \(Safari Mobile\)/g, 'Dispositivo Desconhecido');
data = data.replace(/São Paulo, Brasil • Última revisão às 14:20/g, 'Localização Desconhecida');
data = data.replace(/10\/Set\/2027/g, 'N/A');
data = data.replace(/R\$ 49,90/g, 'R\$ 0,00');
data = data.replace(/Mastercard terminado em 4242/g, 'Nenhum cartão cadastrado');
data = data.replace(/Expira 08\/29/g, '');
data = data.replace(/Plano Auditor Fiscal \(Anual\)/g, 'Plano Gratuito');
data = data.replace(/value="CEO KiEstudos"/g, 'value=""');
data = data.replace(/value="ceokiestudos"/g, 'value=""');
data = data.replace(/value="ceo@kiestudos.com"/g, 'value=""');
data = data.replace(/value="\+55 \(11\) 98822-4411"/g, 'value=""');
data = data.replace(/value="Auditor Fiscal da Receita Federal \(AFRFB\)"/g, 'value=""');
data = data.replace(/CEO\n/g, '\n');
data = data.replace(/>CEO</g, '><');

// Some fixes for specific lines
data = data.replace(/<span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500\/10 text-emerald-400 border border-emerald-500\/30 font-semibold font-mono">\s*<\/span>/, '');

fs.writeFileSync(file, data, 'utf8');
console.log('Fixed configuracoes.tsx');

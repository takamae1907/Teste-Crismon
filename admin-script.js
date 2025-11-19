import { auth, db, storage, signInWithEmailAndPassword, onAuthStateChanged, signOut, collection, addDoc, getDocs, deleteDoc, doc, ref, uploadBytes, getDownloadURL } from './firebase-config.js';

// --- 1. LOGIN ---
const loginScreen = document.getElementById('login-screen');
const adminPanel = document.getElementById('admin-panel');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');

// Verifica se já está logado
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.style.display = 'none';
        adminPanel.style.display = 'block';
        carregarListaProdutos(); // Carrega os produtos ao entrar
    } else {
        loginScreen.style.display = 'block';
        adminPanel.style.display = 'none';
    }
});

// Botão Entrar
btnLogin.addEventListener('click', async () => {
    const email = document.getElementById('email-login').value;
    const senha = document.getElementById('senha-login').value;
    try {
        await signInWithEmailAndPassword(auth, email, senha);
    } catch (error) {
        alert("Erro no login: " + error.message);
    }
});

// Botão Sair
btnLogout.addEventListener('click', () => signOut(auth));


// --- 2. SALVAR PRODUTO ---
document.getElementById('btn-salvar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-salvar');
    btn.innerText = "Salvando...";
    btn.disabled = true;

    try {
        const nome = document.getElementById('prod-nome').value;
        const preco = document.getElementById('prod-preco').value;
        const parcelas = document.getElementById('prod-parcelas').value;
        const categoria = document.getElementById('prod-categoria').value;
        const tamanhos = document.getElementById('prod-tamanhos').value.split(',').map(s => s.trim());
        const corNomes = document.getElementById('prod-cores').value.split(',').map(c => c.trim());
        const fotoFile = document.getElementById('prod-foto').files[0];

        if (!nome || !fotoFile) {
            alert("Preencha o nome e escolha uma foto.");
            btn.innerText = "Salvar Produto";
            btn.disabled = false;
            return;
        }

        // 1. Upload da Foto
        const storageRef = ref(storage, `produtos/${Date.now()}-${fotoFile.name}`);
        await uploadBytes(storageRef, fotoFile);
        const fotoUrl = await getDownloadURL(storageRef);

        // 2. Salvar no Banco
        // Vamos criar cores hexadecimais ficticias para simplificar, ou a dona teria que digitar códigos #000
        // Para simplificar, vamos salvar apenas os nomes das cores.
        
        const novoProduto = {
            nome: nome,
            preco: preco,
            parcelas: parcelas,
            categoria: categoria, // Importante para o filtro
            tamanhos: tamanhos,
            corNomes: corNomes,
            // Array de cores hex para o script antigo não quebrar (geramos cores aleatórias ou padrão)
            cores: corNomes.map(() => "#000000"), 
            fotos: [fotoUrl], // Array com a foto principal
            dataCriacao: new Date()
        };

        await addDoc(collection(db, "produtos"), novoProduto);

        alert("Produto cadastrado com sucesso!");
        location.reload(); // Recarrega para limpar e atualizar

    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar produto.");
        btn.innerText = "Salvar Produto";
        btn.disabled = false;
    }
});


// --- 3. LISTAR E EXCLUIR ---
async function carregarListaProdutos() {
    const listaDiv = document.getElementById('lista-produtos');
    listaDiv.innerHTML = '';

    const querySnapshot = await getDocs(collection(db, "produtos"));
    
    querySnapshot.forEach((docItem) => {
        const prod = docItem.data();
        const id = docItem.id;

        const item = document.createElement('div');
        item.className = 'product-list-item';
        item.innerHTML = `
            <img src="${prod.fotos[0]}" alt="Foto">
            <div class="product-info">
                <strong>${prod.nome}</strong><br>
                <small>${prod.categoria} | ${prod.preco}</small>
            </div>
            <button class="btn-danger" onclick="deletarProduto('${id}')">Excluir</button>
        `;
        listaDiv.appendChild(item);
    });
}

// Função Global para o botão delete funcionar no HTML
window.deletarProduto = async (id) => {
    if(confirm("Tem certeza que deseja excluir este produto?")) {
        try {
            await deleteDoc(doc(db, "produtos", id));
            alert("Produto excluído!");
            carregarListaProdutos();
        } catch (e) {
            alert("Erro ao excluir.");
        }
    }
};
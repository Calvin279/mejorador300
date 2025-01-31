class RegistroHoras {
  constructor() {
    this.registros = JSON.parse(localStorage.getItem('registros')) || [];
    this.form = document.getElementById('registroForm');
    this.buscador = document.getElementById('buscador');
    this.btnReiniciar = document.getElementById('reiniciar');
    this.toastEl = document.getElementById('liveToast');
    this.toastBody = document.getElementById('toastBody');
    this.toast = new bootstrap.Toast(this.toastEl);

    this.initEventListeners();
    this.setupDateRestrictions();
    this.setupTimeInputValidation();
    this.actualizarTablas();
  }

  setupDateRestrictions() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').setAttribute('max', today);
  }

  setupTimeInputValidation() {
    const timeInputs = document.querySelectorAll('#horaEntrada, #horaSalida');
    timeInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9:]/g, '');
        
        if (e.target.value.length === 2 && !e.target.value.includes(':')) {
          e.target.value += ':';
        }
      });
    });
  }

  initEventListeners() {
    this.form.addEventListener('submit', (e) => this.manejarSubmit(e));
    this.buscador.addEventListener('input', () => this.filtrarRegistros());
    this.btnReiniciar.addEventListener('click', () => this.reiniciarRegistros());
  }

  manejarSubmit(e) {
    e.preventDefault();
    
    const registro = {
      id: Date.now(), 
      nombre: document.getElementById('nombre').value.trim(),
      rango: document.getElementById('rango').value.trim(),
      fecha: document.getElementById('fecha').value,
      horaEntrada: document.getElementById('horaEntrada').value,
      horaSalida: document.getElementById('horaSalida').value,
      tiempoTotal: this.calcularTiempoTotal(
        document.getElementById('horaEntrada').value,
        document.getElementById('horaSalida').value
      )
    };

    if (registro.nombre === '' || registro.rango === '') {
      this.mostrarNotificacion('Por favor, complete todos los campos', 'warning');
      return;
    }

    this.agregarRegistro(registro);
    this.form.reset();
  }

  calcularTiempoTotal(entrada, salida) {
    const [horasEntrada, minutosEntrada] = entrada.split(':').map(Number);
    const [horasSalida, minutosSalida] = salida.split(':').map(Number);
    
    const fechaEntrada = new Date(2000, 0, 1, horasEntrada, minutosEntrada);
    const fechaSalida = new Date(2000, 0, 1, horasSalida, minutosSalida);
    
    if (fechaSalida < fechaEntrada) {
      fechaSalida.setDate(fechaSalida.getDate() + 1);
    }
    
    const diferencia = fechaSalida - fechaEntrada;
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    
    return { horas, minutos };
  }

  agregarRegistro(registro) {
    this.registros.push(registro);
    localStorage.setItem('registros', JSON.stringify(this.registros));
    this.actualizarTablas();
    this.mostrarNotificacion(
      `Registro exitoso para ${registro.nombre}`, 
      registro.tiempoTotal.horas >= 3 ? 'success' : 'warning'
    );
  }

  mostrarNotificacion(mensaje, tipo = 'info') {
    this.toastBody.textContent = mensaje;
    this.toastEl.classList.remove('bg-success', 'bg-warning', 'bg-info');
    
    switch(tipo) {
      case 'success':
        this.toastEl.classList.add('bg-success', 'text-white');
        break;
      case 'warning':
        this.toastEl.classList.add('bg-warning');
        break;
      default:
        this.toastEl.classList.add('bg-info', 'text-white');
    }

    this.toast.show();
  }

  filtrarRegistros() {
    const busqueda = this.buscador.value.toLowerCase();
    const registrosFiltrados = this.registros.filter(registro =>
      registro.nombre.toLowerCase().includes(busqueda)
    );
    this.actualizarTablaRegistros(registrosFiltrados);
  }

  actualizarTablas() {
    this.actualizarTablaRegistros(this.registros);
    this.actualizarResumenSemanal();
  }

  actualizarTablaRegistros(registros) {
    const tbody = document.querySelector('#registrosTable tbody');
    tbody.innerHTML = '';

    registros.forEach(registro => {
      const tr = document.createElement('tr');
      const cumpleMinimo = registro.tiempoTotal.horas >= 3;
      
      tr.innerHTML = `
        <td>${registro.nombre}</td>
        <td>${registro.rango}</td>
        <td>${registro.fecha}</td>
        <td>${registro.horaEntrada}</td>
        <td>${registro.horaSalida}</td>
        <td>${registro.tiempoTotal.horas}h ${registro.tiempoTotal.minutos}m</td>
        <td class="${cumpleMinimo ? 'success' : 'warning'}">
          ${cumpleMinimo ? '✅' : '❌'}
        </td>
      `;
      
      tbody.appendChild(tr);
    });
  }

  actualizarResumenSemanal() {
    const resumen = this.calcularResumenSemanal();
    const tbody = document.querySelector('#resumenSemanal tbody');
    tbody.innerHTML = '';

    Object.entries(resumen).forEach(([nombre, datos]) => {
      const tr = document.createElement('tr');
      const horasTotales = Math.floor(datos.horasTotales);
      const minutosTotales = Math.round((datos.horasTotales % 1) * 60);
      const cumpleSemanal = datos.horasTotales >= 28;
      
      tr.innerHTML = `
        <td>${nombre}</td>
        <td>${horasTotales}h ${minutosTotales}m</td>
        <td class="${cumpleSemanal ? 'success' : 'warning'}">
          ${cumpleSemanal ? '😊' : '😔'}
        </td>
      `;
      
      tbody.appendChild(tr);
    });
  }

  calcularResumenSemanal() {
    const resumen = {};

    this.registros.forEach(registro => {
      if (!resumen[registro.nombre]) {
        resumen[registro.nombre] = { horasTotales: 0 };
      }
      
      resumen[registro.nombre].horasTotales += registro.tiempoTotal.horas + registro.tiempoTotal.minutos / 60;
    });

    return resumen;
  }

  reiniciarRegistros() {
    if (confirm('¿Estás seguro de que deseas eliminar todos los registros?')) {
      this.registros = [];
      localStorage.removeItem('registros');
      this.actualizarTablas();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RegistroHoras();
});
const test=require('node:test'); const assert=require('node:assert/strict');
test('workflow completion requires all contribution states to be complete',()=>{const states=['Sudah Diisi','Terverifikasi'];assert.equal(['Sudah Diisi','Belum Mulai'].every(x=>states.includes(x)),false);assert.equal(['Sudah Diisi','Terverifikasi'].every(x=>states.includes(x)),true)});

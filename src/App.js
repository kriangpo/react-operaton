import React, { useState } from 'react';
import { Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';

// ข้อมูลการเชื่อมต่อ Camunda (ต้องอัปเดต URL นี้ให้ถูกต้องตามสภาพแวดล้อมของคุณ)
// โดยทั่วไป Camunda Engine จะเปิดอยู่ที่พอร์ต 8080 
const CAMUNDA_BASE_URL = 'http://docker2.devops.esc.yipintsoigroup.com:8080/engine-rest'; // !!! โปรดแก้ไข URL นี้
const PROCESS_DEFINITION_KEY = 'leave_approval_process2'; // *** แก้ไขให้ตรงกับ id ใน BPMN ล่าสุด ***

// Component หลัก
const App = () => {
  const [formData, setFormData] = useState({
    employeeName: '',
    leaveDay: 1, // Long type
    reason: '',
    approved: false, // Boolean type (ใช้เป็น Checkbox)
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) : value,
    }));
  };

  const mapToCamundaVariables = (data) => {
    return {
      variables: {
        employeeName: { value: data.employeeName, type: "String" },
        leaveDay: { value: data.leaveDay, type: "Long" }, // ใช้ Long ตามที่กำหนดใน BPMN
        reason: { value: data.reason, type: "String" },
        approved: { value: data.approved, type: "Boolean" },
      },
      // สามารถกำหนด Business Key ที่ไม่ซ้ำกันได้
      businessKey: `${data.employeeName}-${Date.now()}` 
    };
  };

  const startProcess = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const apiURL = `${CAMUNDA_BASE_URL}/process-definition/key/${PROCESS_DEFINITION_KEY}/start`;
    const payload = mapToCamundaVariables(formData);

    try {
      const response = await fetch(apiURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({
          type: 'success',
          text: `คำขอลาถูกส่งสำเร็จแล้ว! Process Instance ID: ${result.id}`,
        });
        // รีเซ็ตฟอร์ม
        setFormData({ employeeName: '', leaveDay: 1, reason: '', approved: false });
      } else {
        const errorText = await response.text();
        setMessage({
          type: 'error',
          text: `เกิดข้อผิดพลาดในการเริ่ม Process: ${response.status} - ${errorText.substring(0, 100)}...`,
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `ไม่สามารถเชื่อมต่อกับ Camunda Engine ได้: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-xl p-8 transition-all duration-300 transform hover:shadow-2xl">
        <h1 className="text-3xl font-extrabold text-indigo-700 mb-6 border-b pb-2">
          ระบบยื่นคำขอลาพักร้อน (BPMN Starter)
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          กรอกรายละเอียดเพื่อเริ่ม Process `{PROCESS_DEFINITION_KEY}` ใน Camunda.
        </p>

        {/* Message Box */}
        {message && (
          <div className={`p-4 mb-4 rounded-lg flex items-start space-x-3 ${
            message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 
            'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mt-1" /> : <XCircle className="w-5 h-5 mt-1" />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={startProcess} className="space-y-4">
          
          {/* Employee Name */}
          <div>
            <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700">ชื่อพนักงาน</label>
            <input
              type="text"
              name="employeeName"
              id="employeeName"
              value={formData.employeeName}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="เช่น นาย A สุขสบาย"
            />
          </div>

          {/* Leave Days */}
          <div>
            <label htmlFor="leaveDay" className="block text-sm font-medium text-gray-700">จำนวนวันลา</label>
            <input
              type="number"
              name="leaveDay"
              id="leaveDay"
              min="1"
              value={formData.leaveDay}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">เหตุผลในการลา</label>
            <textarea
              name="reason"
              id="reason"
              rows="3"
              value={formData.reason}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="ระบุเหตุผลในการลาโดยละเอียด"
            ></textarea>
          </div>

          {/* Approved Checkbox (สำหรับจำลองการอนุมัติล่วงหน้า - ปกติจะใส่ใน User Task ถัดไป) */}
          <div className="flex items-center pt-2">
            <input
              id="approved"
              name="approved"
              type="checkbox"
              checked={formData.approved}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="approved" className="ml-3 text-sm font-medium text-gray-700">
              อนุมัติทันที (จำลองค่าเริ่มต้น)
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent text-sm font-bold rounded-xl shadow-md transition duration-300 ${
              loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังส่งคำขอ...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>เริ่ม Process คำขอลา</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;

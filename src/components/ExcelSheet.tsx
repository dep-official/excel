import { useState, useMemo, useRef, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableColumn } from "@nextui-org/react";

interface StockData {
  id: string;
  name: string;
  type: string;
  code: string;
  orderAmount: number;
  productionAmount: number;
  remainingAmount: number;
  dates: { [key: string]: { [columnKey: string]: number | string } };
  isNew?: boolean;
}

interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  isEditable?: boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({ value, onSave, isEditable = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (isEditable) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value.toString()) {
      const cleanValue = editValue.replace(/,/g, '').replace(/^0+(\d)/, '$1');
      onSave(cleanValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // 숫자만 입력된 경우
    if (/^\d*$/.test(newValue.replace(/,/g, ''))) {
      const cleanValue = newValue.replace(/,/g, '').replace(/^0+(\d)/, '$1');
      if (cleanValue === '') {
        setEditValue('');
      } else {
        setEditValue(Number(cleanValue).toLocaleString());
      }
    } else {
      // 숫자가 아닌 경우 그대로 표시
      setEditValue(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const input = e.target as HTMLInputElement;
    
    if (e.key === 'Enter') {
      setIsEditing(false);
      if (editValue !== value.toString()) {
        const cleanValue = editValue.replace(/,/g, '').replace(/^0+(\d)/, '$1');
        onSave(cleanValue);
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value.toString());
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const cursorAtStart = input.selectionStart === 0;
      const cursorAtEnd = input.selectionStart === input.value.length;
      
      if ((e.key === 'ArrowLeft' && !cursorAtStart) || 
          (e.key === 'ArrowRight' && !cursorAtEnd)) {
        e.stopPropagation();
      }
    }
  };

  // 편집 모드일 때 input 요소에 포커스
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // 입력값의 끝으로 커서 이동
      inputRef.current.setSelectionRange(editValue.length, editValue.length);
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[32px] px-2 text-center border-2 border-blue-500 focus:outline-none"
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className="w-full min-h-[32px] px-2 cursor-pointer hover:bg-blue-50 flex items-center justify-center"
    >
      {value}
    </div>
  );
};

const ExcelSheet = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // createEmptyRow 함수를 컴포넌트 내부 최상단으로 이동
  const createEmptyRow = (id: string): StockData => ({
    id,
    name: "",
    type: "",
    code: "",
    orderAmount: 0,
    productionAmount: 0,
    remainingAmount: 0,
    dates: {},
    isNew: true
  });

  const [data, setData] = useState<StockData[]>(() => {
    const initialData: StockData[] = [
      {
        id: "1",
        name: "(KSCB) NPS",
        type: "W",
        code: "100018519",
        orderAmount: 0,
        productionAmount: 0,
        remainingAmount: 0,
        dates: {}
      },
      {
        id: "2",
        name: "(KSCB) NPS",
        type: "R",
        code: "100019542",
        orderAmount: 0,
        productionAmount: 0,
        remainingAmount: 0,
        dates: {}
      },
      createEmptyRow("new") // 빈 행 추가
    ];

    try {
      const savedData = localStorage.getItem('excelData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (Array.isArray(parsedData)) {
          return [...parsedData, createEmptyRow("new")];
        }
      }
    } catch (error) {
      console.error('저장된 데이터 로드 중 오류:', error);
    }
    
    return initialData;
  });

  const today = useMemo(() => {
    const date = new Date();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = daysOfWeek[date.getDay()];
    return `${month}월 ${day}일(${dayOfWeek})`;
  }, []);

  const selectedDateFormatted = useMemo(() => {
    const date = new Date(selectedDate);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = daysOfWeek[date.getDay()];
    return `${month}월 ${day}일(${dayOfWeek})`;
  }, [selectedDate]);

  const dates = useMemo(() => {
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    const baseDate = new Date(selectedDate);
    
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + index);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const dayOfWeek = daysOfWeek[date.getDay()];
      return `${month}월 ${day}일(${dayOfWeek})`;
    });
  }, [selectedDate]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value;
    setSelectedDate(newDate);
    
    try {
      const savedData = localStorage.getItem('excelData');
      if (savedData) {
        const allData = JSON.parse(savedData);
        const newDateFormatted = formatDate(new Date(newDate));
        
        if (allData[newDate]) {
          const loadedData = allData[newDate].map((item: StockData) => {
            const dateValues = item.dates[newDateFormatted] || {};
            
            return {
              ...item,
              productionAmount: dateValues.productionAmount || 0,
              orderAmount: dateValues.orderAmount || 0,
              dates: item.dates || {}
            };
          });
          // 기존 데이터에 빈 행 추가
          setData([...loadedData, createEmptyRow(String(Date.now()))]);
        } else {
          const initialData = [
            {
              id: "1",
              name: "(KSCB) NPS",
              type: "W",
              code: "100018519",
              orderAmount: 0,
              productionAmount: 0,
              remainingAmount: 0,
              dates: {}
            },
            {
              id: "2",
              name: "(KSCB) NPS",
              type: "R",
              code: "100019542",
              orderAmount: 0,
              productionAmount: 0,
              remainingAmount: 0,
              dates: {}
            },
            createEmptyRow(String(Date.now())) // 초기 데이터에도 빈 행 추가
          ];
          setData(initialData);
        }
      }
    } catch (error) {
      console.error('날짜 변경 중 데이터 로드 오류:', error);
    }
  };

  // 날짜 포맷팅 함수 추가
  const formatDate = (date: Date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = daysOfWeek[date.getDay()];
    return `${month}월 ${day}일(${dayOfWeek})`;
  };

  // 숫자 포맷팅 함수 추가
  const formatNumber = (value: number | string): string => {
    if (value === '' || value === undefined) return '';
    // 문자열로 변환하고 앞의 0과 쉼표 제거
    const cleanValue = String(value).replace(/,/g, '').replace(/^0+(\d)/, '$1');
    // 숫자가 아닌 경우 원래 값 반환
    if (isNaN(Number(cleanValue))) return String(value);
    return Number(cleanValue).toLocaleString();
  };

  const columns = useMemo(() => {
    return [
      { key: "name", label: "품명" },
      { key: "type", label: "구분용" },
      { key: "code", label: "자재코드" },
      { key: "orderAmount", label: "발주량" },
      { key: "productionAmount", label: "생산량" },
      { key: "remainingAmount", label: "잔량" },
      ...dates.map((date) => ({ key: date, label: date })),
    ];
  }, [dates]);

  const calculateTotal = (key: string) => {
    return data.reduce((sum, item) => {
      if (typeof item[key as keyof StockData] === 'number') {
        return sum + (item[key as keyof StockData] as number);
      }
      return sum;
    }, 0);
  };

  const calculateDateTotal = (date: string) => {
    const savedData = localStorage.getItem('excelData');
    let total = 0;

    if (savedData) {
      const allData = JSON.parse(savedData);
      Object.keys(allData).forEach(dateKey => {
        const dateItems = allData[dateKey];
        dateItems.forEach((item: StockData) => {
          if (item.dates[date] && typeof item.dates[date].productionAmount === 'number') {
            total += Number(item.dates[date].productionAmount);
          }
        });
      });
    }

    return total;
  };

  const handleRowAdd = () => {
    setData(prevData => {
      // const lastRow = prevData[prevData.length - 1];
      const newId = String(Date.now()); // 고유한 ID 생성
      return [...prevData, createEmptyRow(newId)];
    });
  };

  const handleCellEdit = (rowId: string, columnKey: string, value: string) => {
    setHasUnsavedChanges(true);
    setData(prevData => {
      const updatedData = prevData.map(row => {
        if (row.id === rowId) {
          const numValue = columnKey === 'name' || columnKey === 'type' || columnKey === 'code'
            ? value
            : Number(value.replace(/[,]/g, '').replace(/^0+(\d)/, '$1')) || 0;

          const updatedRow = {
            ...row,
            [columnKey]: numValue,
            isNew: false,
            dates: {
              ...row.dates,
              [selectedDateFormatted]: {
                ...row.dates[selectedDateFormatted],
                [columnKey]: numValue
              }
            }
          };

          // 셀 수정 시 자동 저장
          try {
            const savedData = localStorage.getItem('excelData');
            if (savedData !== null) {
              const allData = JSON.parse(savedData);
              
              if (!allData[selectedDate]) {
                allData[selectedDate] = [];
              }

              const existingRowIndex = allData[selectedDate].findIndex((item: StockData) => item.id === rowId);
              
              if (existingRowIndex >= 0) {
                allData[selectedDate][existingRowIndex] = updatedRow;
              } else {
                allData[selectedDate].push(updatedRow);
              }
              
              localStorage.setItem('excelData', JSON.stringify(allData));
            }
          } catch (error) {
            console.error('자동 저장 중 오류 발생:', error);
          }

          return updatedRow;
        }
        return row;
      });

      // 마지막 행이 수정되었고 더 이상 새 행이 아닌 경우에만 새 행 추가
      if (updatedData[updatedData.length - 1].id === rowId && !updatedData[updatedData.length - 1].isNew) {
        const newId = String(Date.now());
        return [...updatedData, createEmptyRow(newId)];
      }

      return updatedData;
    });
  };

  const rows = useMemo(() => {
    // 실제 데이터 행 (합계 행 제외)
    const dataRows = data.map((item) => {
      const selectedDateValues = item.dates[selectedDateFormatted] || {};
      
      const baseRow = {
        key: item.id,
        name: item.name,
        type: item.type,
        code: item.code,
        orderAmount: formatNumber(selectedDateValues.orderAmount || item.orderAmount || 0),
        productionAmount: formatNumber(selectedDateValues.productionAmount || item.productionAmount || 0),
        remainingAmount: formatNumber(selectedDateValues.remainingAmount || item.remainingAmount || 0),
      };

      const dateData = dates.reduce((acc, date) => {
        const savedData = localStorage.getItem('excelData');
        let value = 0;

        if (savedData) {
          const allData = JSON.parse(savedData);
          Object.keys(allData).forEach(dateKey => {
            const dateItems = allData[dateKey];
            const dateItem = dateItems.find((d: StockData) => d.id === item.id);
            if (dateItem && dateItem.dates[date]) {
              value = dateItem.dates[date].productionAmount || 0;
            }
          });
        }

        return {
          ...acc,
          [date]: formatNumber(value)
        };
      }, {});

      return {
        ...baseRow,
        ...dateData,
        isNew: item.isNew
      };
    });

    // 합계 행 (빈 행 제외하고 계산)
    const totalRow = {
      key: "total",
      name: "합계",
      type: "",
      code: "",
      orderAmount: formatNumber(calculateTotal("orderAmount")),
      productionAmount: formatNumber(calculateTotal("productionAmount")),
      remainingAmount: formatNumber(calculateTotal("remainingAmount")),
      ...dates.reduce((acc, date) => ({
        ...acc,
        [date]: formatNumber(calculateDateTotal(date))
      }), {})
    };

    return [...dataRows, totalRow];
  }, [data, dates, selectedDateFormatted]);

  const handleSave = () => {
    try {
      const savedData = localStorage.getItem('excelData');
      const allData = savedData ? JSON.parse(savedData) : {};
      
      const dataToSave = data.filter(item => !item.isNew);
      
      allData[selectedDate] = dataToSave;
      localStorage.setItem('excelData', JSON.stringify(allData));

      setHasUnsavedChanges(false);
      alert('저장되었습니다.');
    } catch (error) {
      console.error('저장 중 오류 발생:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleLoad = () => {
    try {
      const savedData = localStorage.getItem('excelData');
      if (savedData !== null) {
        const allData = JSON.parse(savedData);
        if (allData[selectedDate]) {
          setData([...allData[selectedDate], createEmptyRow(String(Date.now()))]);
        } else {
          // 해당 날짜의 데이터가 없으면 초기 데이터로 설정
          setData([
            {
              id: "1",
              name: "(KSCB) NPS",
              type: "W",
              code: "100018519",
              orderAmount: 0,
              productionAmount: 0,
              remainingAmount: 0,
              dates: {}
            },
            {
              id: "2",
              name: "(KSCB) NPS",
              type: "R",
              code: "100019542",
              orderAmount: 0,
              productionAmount: 0,
              remainingAmount: 0,
              dates: {}
            },
            createEmptyRow(String(Date.now())) // 초기 데이터에도 빈 행 추가
          ]);
        }
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('불러오기 중 오류 발생:', error);
      alert('불러오기 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">임대설비(7호기) 발주 진도표</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="writeDate" className="text-sm text-gray-500">작성일:</label>
          <input
            id="writeDate"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={handleSave}
          className={`px-4 py-1.5 text-white rounded transition-colors
            ${hasUnsavedChanges 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed'}`}
          disabled={!hasUnsavedChanges}
        >
          저장
        </button>
        <button 
          onClick={handleLoad}
          className="px-4 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          불러오기
        </button>
        <button 
          onClick={handleRowAdd}
          className="px-4 py-1.5 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          + 새 행 추가
        </button>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4">📎</span>
          셀을 클릭하여 데이터를 수정할 수 있습니다.
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4">📎</span>
          수정 후 '저장' 버튼을 눌러야 실시간 데이터를 유지할 수 있습니다.
        </div>
      </div>

      <Table
        aria-label="Excel-like spreadsheet"
        className="min-w-full border border-gray-200"
        removeWrapper
        isHeaderSticky
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn 
              key={column.key}
              className={`
                py-3 font-bold text-center border-b border-r border-gray-200 last:border-r-0
                ${column.label === today ? 'bg-yellow-100' : 
                  column.label === selectedDateFormatted ? 'bg-green-100' : 
                  'bg-gray-100'}
              `}
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={rows}>
          {(item) => (
            <TableRow 
              key={item.key}
              className={`
                ${item.key === "total" ? "bg-gray-50" : ""}
                ${(item as any).isNew ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"}
              `}
            >
              {(columnKey) => (
                <TableCell 
                  className={`
                    text-center min-h-[32px] border-b border-r border-gray-200 last:border-r-0
                    ${item.key === "total" ? "font-bold" : ""}
                    ${typeof item[columnKey as keyof typeof item] === "number" || 
                      dates.includes(columnKey.toString()) ? "text-right" : ""}
                    ${dates.includes(columnKey.toString()) ? 
                      columnKey.toString() === today ? "bg-yellow-50" :
                      columnKey.toString() === selectedDateFormatted ? "bg-green-50" :
                      "bg-blue-50" 
                      : (item as any).isNew ? "bg-white" : ""}
                    ${(item as any).isNew ? "italic text-gray-500" : ""}
                  `}
                >
                  <EditableCell
                    value={String(item[columnKey as keyof typeof item] || "")}
                    onSave={(value) => handleCellEdit(item.key.toString(), columnKey.toString(), value)}
                    isEditable={
                      item.key !== "total" && 
                      (columnKey === "name" || 
                       columnKey === "type" || 
                       columnKey === "code" || 
                       columnKey === "orderAmount" || 
                       columnKey === "productionAmount" || 
                       columnKey === "remainingAmount")
                    }
                  />
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExcelSheet; 